package gov.cmr.minfi.db.gbe.app.referentiel.administratif;

public enum TypeAdministration {
    ADMINISTRATION_CENTRALE("Administration centrale", "Central administration"),
    SERVICE_DECONCENTRE("Service déconcentré", "Deconcentrated service"),
    SERVICE_DECENTRALISE("Service décentralisé autonome", "Autonomous decentralized service"),
    SANS_EXISTENCE_ORGANIQUE("Sans existence organique", "Without organic existence");

    private final String libelleFr;
    private final String libelleEn;

    TypeAdministration(String libelleFr, String libelleEn) {
        this.libelleFr = libelleFr;
        this.libelleEn = libelleEn;
    }

    public String getLibelleFr() { return libelleFr; }
    public String getLibelleEn() { return libelleEn; }
}
