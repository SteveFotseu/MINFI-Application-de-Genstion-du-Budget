package gov.cmr.minfi.db.gbe.app.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserSummaryResponse(
        String id,
        String firstName,
        String lastName,
        String phoneNumber,
        boolean enabled,
        boolean firstLogin,
        String email,
        boolean mfaEnabled,
        LocalDate createdDate,
        List<AffectationSummary> affectations

) {
}
