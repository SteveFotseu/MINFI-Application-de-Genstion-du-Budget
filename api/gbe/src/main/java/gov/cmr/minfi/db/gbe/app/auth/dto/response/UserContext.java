package gov.cmr.minfi.db.gbe.app.auth.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record UserContext(
        String userId,
        String firstName,
        String lastName,
        String email,
        String matricule,
        String nui,
        String cni,
        List<AffectationContext> affectations
) {
    
}
