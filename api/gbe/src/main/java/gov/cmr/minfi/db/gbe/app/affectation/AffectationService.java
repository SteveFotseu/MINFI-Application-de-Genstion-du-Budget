package gov.cmr.minfi.db.gbe.app.affectation;

import gov.cmr.minfi.db.gbe.app.admin.dto.AffectationSummary;
import gov.cmr.minfi.db.gbe.app.affectation.dto.AffectationRequest;
import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;

import java.util.List;

public interface AffectationService {
    AffectationSummary addAffectation(String userId, AffectationRequest request);

    List<AffectationSummary> getAffectations(String userId);

    AffectationSummary updateRole(String userId, String affectationId, RoleSysteme roleSysteme);

    void activateAffectation(String userId, String affectationId);

    void deactivateAffectation(String userId, String affectationId);

    void removeAffectation(String userId, String affectationsId);
}
