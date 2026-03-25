package gov.cmr.minfi.db.gbe.app.iam.role;

import gov.cmr.minfi.db.gbe.app.iam.permission.Permission;

import java.util.Set;

public enum RoleSysteme {

    ADMIN("Administrateur") {
        @Override
        public Set<Permission> getDefaultPermissions() {
            return Set.of(
                    Permission.MANAGE_USERS,
                    Permission.MANAGE_AFFECTATIONS
            );
        }
    },
    ORDONNATEUR_PRINCIPAL("Ordonnateur principal") {
        @Override
        public Set<Permission> getDefaultPermissions() {
            return Set.of(
                    Permission.ENGAGE_DEPENSE,
                    Permission.REVISER_AE,
                    Permission.REVISER_CP,
                    Permission.REJETER_DEPENSE
            );
        }
    },
    ORDONNATEUR_SECONDAIRE("Ordonnateur secondaire") {
        @Override
        public Set<Permission> getDefaultPermissions() {
            return Set.of(
                    Permission.ENGAGE_DEPENSE,
                    Permission.REVISER_AE,
                    Permission.REVISER_CP,
                    Permission.REJETER_DEPENSE
            );
        }
    },
    ORDONNATEUR_DELEGUE("Ordonnateur délégué") {
        @Override
        public Set<Permission> getDefaultPermissions() {
            return Set.of(
                    Permission.ENGAGE_DEPENSE,
                    Permission.REJETER_DEPENSE
            );
        }
    },
    CONTROLEUR_FINANCIER("Contrôleur financier") {
        @Override
        public Set<Permission> getDefaultPermissions() {
            return Set.of(
                    Permission.VISA_CFI,
                    Permission.REJETER_CFI
            );
        }
    },
    COMPTABLE("Comptable") {
        @Override
        public Set<Permission> getDefaultPermissions() {
            return Set.of(
                    Permission.LIQUIDER_DEPENSE,
                    Permission.PAYER_DEPENSE
            );
        }
    };

    private final String libelle;

    RoleSysteme(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }

    public abstract Set<Permission> getDefaultPermissions();
}