#!/usr/bin/env fish
# Supabase Installations-Script für Enterprise-Umgebungen
# Autor: goldjunge91
# Datum: 2025-07-18

function log_info
    set_color yellow
    echo "[INFO] $argv"
    set_color normal
end

function log_success
    set_color green
    echo "[SUCCESS] $argv"
    set_color normal
end

function log_error
    set_color red
    echo "[ERROR] $argv"
    set_color normal
end

function error_exit
    log_error $argv
    exit 1
end


# Supabase-Keys: aus CI/CD, Benutzereingabe oder Default
set -l ENV_FILE ".env.local"

if set -q SUPABASE_URL
    set -l SUPABASE_URL $SUPABASE_URL
else
    read -P "Gib die SUPABASE_URL ein (Enter für Default): " SUPABASE_URL
    if test -z "$SUPABASE_URL"
        set SUPABASE_URL "<your_supabase_project_url>"
    end
end

if set -q SUPABASE_ANON_KEY
    set -l SUPABASE_ANON_KEY $SUPABASE_ANON_KEY
else
    read -P "Gib den SUPABASE_ANON_KEY ein (Enter für Default): " SUPABASE_ANON_KEY
    if test -z "$SUPABASE_ANON_KEY"
        set SUPABASE_ANON_KEY "<your_supabase_anon_key>"
    end
end

# Prüfe pnpm
if not type -q pnpm
    error_exit "pnpm ist nicht installiert. Bitte pnpm installieren."
end

log_info "Installiere @supabase/supabase-js und @supabase/ssr ..."
pnpm add @supabase/supabase-js @supabase/ssr
or error_exit "pnpm Installation fehlgeschlagen. Bitte prüfe pnpm und deine Internetverbindung."
log_success "Supabase-Pakete erfolgreich installiert."

# Schreibe Umgebungsvariablen

log_info "Prüfe $ENV_FILE ..."
if test -f $ENV_FILE
    set file_size (stat -f %z $ENV_FILE)
    if test $file_size -gt 0
        log_info "$ENV_FILE existiert und ist nicht leer. Keys werden ergänzt, falls sie fehlen."
        if not grep -q "^NEXT_PUBLIC_SUPABASE_URL=" $ENV_FILE
            if test "$SUPABASE_URL" = "<your_supabase_project_url>"
                log_info "Default SUPABASE_URL wird nicht hinzugefügt, da Variable bereits existiert."
            else
                echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL" >> $ENV_FILE
            end
        end
        if not grep -q "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" $ENV_FILE
            if test "$SUPABASE_ANON_KEY" = "<your_supabase_anon_key>"
                log_info "Default SUPABASE_ANON_KEY wird nicht hinzugefügt, da Variable bereits existiert."
            else
                echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> $ENV_FILE
            end
        end
        or error_exit "Keys konnten nicht zu $ENV_FILE hinzugefügt werden. Prüfe Schreibrechte."
        log_success "Keys wurden zu $ENV_FILE hinzugefügt (nur falls nicht vorhanden und kein Default)."
    else
        log_info "$ENV_FILE existiert, ist aber leer. Keys werden geschrieben."
        # Schreibe nur, wenn keine Variable existiert
        if grep -q "^NEXT_PUBLIC_SUPABASE_URL=" $ENV_FILE
            log_info "SUPABASE_URL existiert bereits, Default wird nicht geschrieben."
        else
            echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL" >> $ENV_FILE
        end
        if grep -q "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" $ENV_FILE
            log_info "SUPABASE_ANON_KEY existiert bereits, Default wird nicht geschrieben."
        else
            echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> $ENV_FILE
        end
        or error_exit "$ENV_FILE konnte nicht beschrieben werden. Prüfe Schreibrechte."
        log_success "$ENV_FILE wurde beschrieben."
    end
else
    log_info "$ENV_FILE existiert nicht. Datei wird erstellt."
    echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL" > $ENV_FILE
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> $ENV_FILE
    or error_exit "$ENV_FILE konnte nicht erstellt werden. Prüfe Schreibrechte."
    log_success "$ENV_FILE wurde erstellt."
end

# Hinweis für Schlüsselverwaltung

# Prüfe .gitignore auf env-Ausschluss
set -l GITIGNORE_FILE ".gitignore"
set -l ENV_PATTERN "*.env*"

if test -f $GITIGNORE_FILE
    if grep -q "$ENV_PATTERN" $GITIGNORE_FILE
        set_color green
        echo "[INFO] .gitignore schützt env-Dateien: '$ENV_PATTERN' ist eingetragen."
        set_color normal
    else
        set_color red
        echo "[WARNUNG] .gitignore schützt env-Dateien NICHT! '$ENV_PATTERN' wird jetzt hinzugefügt."
        set_color normal
        echo "$ENV_PATTERN" >> $GITIGNORE_FILE
        set_color green
        echo "[INFO] '$ENV_PATTERN' wurde zu .gitignore hinzugefügt."
        set_color normal
    end
else
    set_color red
    echo "[WARNUNG] Keine .gitignore gefunden! Es wird eine neue .gitignore mit '$ENV_PATTERN' erstellt."
    set_color normal
    echo "$ENV_PATTERN" > $GITIGNORE_FILE
    set_color green
    echo "[INFO] Neue .gitignore mit '$ENV_PATTERN' wurde erstellt."
    set_color normal
end

set_color yellow
echo "[WARNUNG] Bitte trage die echten Supabase-Keys ein und verwalte sie sicher! Niemals sensible Schlüssel in öffentliche Repos pushen."
set_color normal