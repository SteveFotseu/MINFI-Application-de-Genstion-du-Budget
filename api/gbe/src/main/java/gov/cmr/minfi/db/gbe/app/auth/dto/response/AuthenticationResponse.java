package gov.cmr.minfi.db.gbe.app.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

@Builder
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record AuthenticationResponse(
        String accessToken,
        String refreshToken,
        String tokenType,

        boolean mfaEnabled,
        boolean firstLogin,

        String secretImageUri,

        UserContext userContext

) {
}
