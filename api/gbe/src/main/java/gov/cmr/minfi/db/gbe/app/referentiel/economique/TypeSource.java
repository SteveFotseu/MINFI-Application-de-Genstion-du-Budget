package gov.cmr.minfi.db.gbe.app.referentiel.economique;

public enum TypeSource {

    FONDS_PROPRES(
            "Fonds propres",
            "Own funds"
    ),
    DON_INTERIEUR(
            "Don intérieur",
            "Domestic grant"
    ),
    DON_EXTERIEUR(
            "Don extérieur",
            "External grant"
    ),
    PRET_INTERIEUR(
            "Prêt intérieur",
            "Domestic loan"
    ),
    PRET_EXTERIEUR(
            "Prêt extérieur",
            "External loan"
    );

    private final String libelleFr;
    private final String libelleEn;

    TypeSource(String libelleFr, String libelleEn) {
        this.libelleFr = libelleFr;
        this.libelleEn = libelleEn;
    }

    public String getLibelleFr() { return libelleFr; }
    public String getLibelleEn() { return libelleEn; }
}