package gov.cmr.minfi.db.gbe.app.auth;

import gov.cmr.minfi.db.gbe.app.auth.dto.request.AuthenticationRequest;
import gov.cmr.minfi.db.gbe.app.auth.dto.request.RefreshRequest;
import gov.cmr.minfi.db.gbe.app.auth.dto.request.SetupMfaRequest;
import gov.cmr.minfi.db.gbe.app.auth.dto.request.VerificationRequest;
import gov.cmr.minfi.db.gbe.app.auth.dto.response.AuthenticationResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication API")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public AuthenticationResponse login(
            @Valid @RequestBody AuthenticationRequest request
    ) {
        return authenticationService.login(request);
    }

    @PostMapping("/setup-mfa")
    @ResponseStatus(HttpStatus.OK)
    public AuthenticationResponse setupMfa(
            @Valid @RequestBody SetupMfaRequest request
    ) {
        return authenticationService.setupMfa(request);
    }

    @PostMapping("/verify")
    @ResponseStatus(HttpStatus.OK)
    public AuthenticationResponse verify(
            @Valid @RequestBody VerificationRequest request
    ) {
        return authenticationService.verifyCode(request);
    }

    @PostMapping("/refresh")
    @ResponseStatus(HttpStatus.OK)
    public AuthenticationResponse refresh(
            @Valid @RequestBody RefreshRequest request
    ) {
        return authenticationService.refreshToken(request);
    }
}