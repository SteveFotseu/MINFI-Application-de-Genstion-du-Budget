package gov.cmr.minfi.db.gbe.app.affectation;

import gov.cmr.minfi.db.gbe.app.admin.dto.AffectationSummary;
import gov.cmr.minfi.db.gbe.app.affectation.dto.AffectationRequest;
import gov.cmr.minfi.db.gbe.app.affectation.dto.UpdateRoleRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users/{userId}/affectations")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGE_AFFECTATIONS')")
@Tag(name = "Affectations", description = "Gestion des affectations utilisateur")
public class AffectationController {

    private final AffectationService affectationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AffectationSummary addAffectation(
            @PathVariable String userId,
            @Valid @RequestBody AffectationRequest request
    ) {
        return affectationService.addAffectation(userId, request);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<AffectationSummary> getAffectations(
            @PathVariable String userId
    ) {
        return affectationService.getAffectations(userId);
    }

    @PatchMapping("/{affectationId}/role")
    @ResponseStatus(HttpStatus.OK)
    public AffectationSummary updateRole(
            @PathVariable String userId,
            @PathVariable String affectationId,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        return affectationService.updateRole(userId, affectationId, request.roleSysteme());
    }

    @PatchMapping("/{affectationId}/activate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void activateAffectation(
            @PathVariable String userId,
            @PathVariable String affectationId
    ) {
        affectationService.activateAffectation(userId, affectationId);
    }

    @PatchMapping("/{affectationId}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateAffectation(
            @PathVariable String userId,
            @PathVariable String affectationId
    ) {
        affectationService.deactivateAffectation(userId, affectationId);
    }

    @DeleteMapping("/{affectationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAffectation(
            @PathVariable String userId,
            @PathVariable String affectationId
    ) {
        affectationService.removeAffectation(userId, affectationId);
    }
}