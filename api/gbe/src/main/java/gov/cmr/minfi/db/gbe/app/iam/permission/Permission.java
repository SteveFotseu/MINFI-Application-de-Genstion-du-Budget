package gov.cmr.minfi.db.gbe.app.iam.permission;

public enum Permission {
    // Ordonateur
    ENGAGE_DEPENSE("Engager une dépense"),
    REVISER_AE("Rèviser les AE"),
    REVISER_CP("Réviser les CP"),
    REJETER_DEPENSE("Rejeter une dépense"),

    // Controleur financier
    VISA_CFI("Viser une dépense"),
    REJETER_CFI("Rejeter au niveau CFI"),

    // Comptable
    LIQUIDER_DEPENSE("Liquider une depense"),
    PAYER_DEPENSE("Payer une dépense"),

    // Admin
    MANAGE_USERS("Gérer les utilisateurs"),
    MANAGE_AFFECTATIONS("Gérer les affectations");

    private  final String libelle;

    Permission(String libelle){
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }
}
