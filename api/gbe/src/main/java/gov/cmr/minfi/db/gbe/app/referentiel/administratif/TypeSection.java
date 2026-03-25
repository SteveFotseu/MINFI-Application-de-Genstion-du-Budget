package gov.cmr.minfi.db.gbe.app.referentiel.administratif;

public enum TypeSection {

    MINISTERE(
            "M",
            "Ministère",
            "Ministry"
    ),
    INSTITUTION_CONSTITUTIONNELLE(
            "C",
            "Institution constitutionnelle",
            "Constitutional institution"
    ),
    BUDGET_ANNEXE(
            "A",
            "Budget annexe",
            "Annexed budget"
    );

    private final String code;
    private final String libelleFr;
    private final String libelleEn;

    TypeSection(String code, String libelleFr, String libelleEn) {
        this.code = code;
        this.libelleFr = libelleFr;
        this.libelleEn = libelleEn;
    }

    public String getCode() { return code; }
    public String getLibelleFr() { return libelleFr; }
    public String getLibelleEn() { return libelleEn; }
}