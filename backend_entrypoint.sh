#!/usr/bin/env bash

set -eu

fail() {
    printf >&2 "%s: %s\n" "$0" "$1"
    exit 1
}

wait_for_db() {
    wait-for-it "${CVAT_POSTGRES_HOST}:${CVAT_POSTGRES_PORT:-5432}" -t 0
}

wait_for_redis_inmem() {
    wait-for-it "${CVAT_REDIS_INMEM_HOST}:${CVAT_REDIS_INMEM_PORT:-6379}" -t 0
}

wait_for_clickhouse() {
    wait-for-it "${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT:-8123}" -t 0
}

cmd_bash() {
    exec bash "$@"
}

cmd_init() {
    wait_for_db
    ~/manage.py migrate

    wait_for_redis_inmem
    ~/manage.py migrateredis
    ~/manage.py syncperiodicjobs

    if [[ "${CVAT_ANALYTICS:-0}" == "1" ]]; then
        wait_for_clickhouse
        python components/analytics/clickhouse/init.py
    fi

    # Automatically update Site domain and SocialApp to match CVAT_BASE_URL and Cognito settings
    ~/manage.py shell <<EOF
import os
from urllib.parse import urlparse
from django.contrib.sites.models import Site
try:
    # 1. Update Site Domain
    base_url = os.environ.get('CVAT_BASE_URL')
    if base_url:
        parsed_url = urlparse(base_url)
        domain = parsed_url.netloc
        site = Site.objects.get(id=os.environ.get('SITE_ID', 1))
        if site.domain != domain:
            print(f"Updating site domain from {site.domain} to {domain}")
            site.domain = domain
            site.name = domain
            site.save()

        # 2. Register Cognito Social App (required for SSO to work)
        from allauth.socialaccount.models import SocialApp
        client_id = os.environ.get('COGNITO_APP_ID')
        secret = os.environ.get('COGNITO_APP_SECRET')
        if client_id and secret:
            app, created = SocialApp.objects.get_or_create(
                provider='amazon_cognito',
                defaults={'name': 'Cognito', 'client_id': client_id, 'secret': secret}
            )
            if not created and (app.client_id != client_id or app.secret != secret):
                print("Updating Cognito SocialApp credentials...")
                app.client_id = client_id
                app.secret = secret
                app.save()
            app.sites.add(site)
            print("Cognito SocialApp is registered and linked to site.")
    else:
        print("CVAT_BASE_URL is not set, skipping site/SSO update")
except Exception as e:
    print(f"Could not update site/SSO configuration: {e}")
EOF
}

_get_includes() {
    declare -A merged_config
    for config in ~/backend_entrypoint.d/*.conf; do
        declare -A config=$(cat $config)
        for key in "${!config[@]}"; do
            if [ -v merged_config[$key] ]; then
                fail "Duplicated component definition: $key"
            fi
            merged_config[$key]=${config[$key]}
        done
    done

    extra_configs=()
    for component in "$@"; do
        if ! [ -v merged_config[$component] ]; then
            fail "Unexpected worker: $component"
        fi

        for include in ${merged_config["$component"]}; do
            if ! [[ ${extra_configs[@]} =~ $include ]] && \
                ( ! [[ "$include" == "clamav" ]] || [[ "${CLAM_AV:-}" == "yes" ]] ); then
                extra_configs+=("$include")
            fi
        done
    done

    if [ ${#extra_configs[@]} -gt 0 ]; then
        printf 'reusable/%s.conf ' "${extra_configs[@]}"
    fi
}

cmd_run() {
    if [ "$#" -eq 0 ]; then
        fail "run: at least 1 argument is expected"
    fi

    component="$1"

    if [ "$component" = "server" ]; then
        ~/manage.py collectstatic --no-input
    fi

    wait_for_db

    echo "waiting for migrations to complete..."
    while ! ~/manage.py migrate --check; do
        sleep 10
    done

    wait_for_redis_inmem
    echo "waiting for Redis migrations to complete..."
    while ! ~/manage.py migrateredis --check; do
        sleep 10
    done

    supervisord_includes=""
    postgres_app_name="cvat:$component"
    if [ "$component" = "server" ]; then
        supervisord_includes=$(_get_includes "$component")
    elif [ "$component" = "worker"  ]; then
        if [ "$#" -eq 1 ]; then
            fail "run worker: expected at least 1 queue name"
        fi

        queue_list="${@:2}"
        echo "Workers to run: $queue_list"
        export CVAT_QUEUES=$queue_list

        postgres_app_name+=":${queue_list// /+}"

        supervisord_includes=$(_get_includes $queue_list)
    fi
    echo "Additional supervisor configs that will be included: $supervisord_includes"

    export CVAT_POSTGRES_APPLICATION_NAME=$postgres_app_name
    export CVAT_SUPERVISORD_INCLUDES=$supervisord_includes

    exec supervisord -c "supervisord/$component.conf"
}

if [ $# -eq 0 ]; then
    echo >&2 "$0: at least one subcommand required"
    echo >&2 ""
    echo >&2 "available subcommands:"
    echo >&2 "    bash <bash args...>"
    echo >&2 "    init"
    echo >&2 "    run server"
    echo >&2 "    run worker <list of queues>"
    exit 1
fi

for init_script in /etc/cvat/init.d/*; do
    if [ -r "$init_script" ]; then
        . "$init_script"
    fi
done

while [ $# -ne 0 ]; do
    if [ "$(type -t "cmd_$1")" != "function" ]; then
        fail "unknown subcommand: $1"
    fi

    cmd_name="$1"

    shift

    "cmd_$cmd_name" "$@"
done
