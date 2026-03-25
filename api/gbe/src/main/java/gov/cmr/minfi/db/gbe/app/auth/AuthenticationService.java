package gov.cmr.minfi.db.gbe.app.auth;

import gov.cmr.minfi.db.gbe.app.auth.dto.request.*;
import gov.cmr.minfi.db.gbe.app.auth.dto.response.AuthenticationResponse;

public interface AuthenticationService {
    AuthenticationResponse verifyCode(VerificationRequest verificationRequest);

    AuthenticationResponse login(AuthenticationRequest request);

    AuthenticationResponse setupMfa(SetupMfaRequest request);

    AuthenticationResponse register(RegistrationRequest request);

    AuthenticationResponse refreshToken(RefreshRequest request);
}
