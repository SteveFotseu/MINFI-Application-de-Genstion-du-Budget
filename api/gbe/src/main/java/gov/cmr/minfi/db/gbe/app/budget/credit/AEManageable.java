package gov.cmr.minfi.db.gbe.app.budget.credit;

import java.math.BigDecimal;

public interface AEManageable {
    void consommerAE(BigDecimal montant);

    void libererAE(BigDecimal montant);
}