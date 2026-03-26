package gov.cmr.minfi.db.gbe.app.budget.credit;

public interface StatutTransitionable {
    void bloquer();

    void debloquer();

    void annuler();

    void solder();

    void engager();
}