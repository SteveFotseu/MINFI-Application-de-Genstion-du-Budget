package gov.cmr.minfi.db.gbe.app.budget.credit;

import java.math.BigDecimal;

public interface CPManageable {
    void consommerCP(BigDecimal montant);

    void libererCP(BigDecimal montant);
}