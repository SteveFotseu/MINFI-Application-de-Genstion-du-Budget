package gov.cmr.minfi.db.gbe.app.budget.credit;

import gov.cmr.minfi.db.gbe.app.budget.credit.dto.CreateCreditRequest;
import gov.cmr.minfi.db.gbe.app.budget.credit.dto.CreditBudgetaireResponse;
import gov.cmr.minfi.db.gbe.app.budget.credit.dto.UpdateCreditBudgetaireRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/credits")
@RequiredArgsConstructor
@Tag(name = "Credit Budgetaire", description = "Budget credit management API")
public class CreditBudgetaireController {

    private final CreditBudgetaireService creditBudgetaireService;


    // Création
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('REVISER_AE')")
    public CreditBudgetaireResponse createCredit(
            @Valid @RequestBody CreateCreditRequest request
    ) {
        return creditBudgetaireService.createCredit(request);
    }


    // Consultation
    @GetMapping("/{creditId}")
    @ResponseStatus(HttpStatus.OK)
    public CreditBudgetaireResponse getCredit(
            @PathVariable String creditId
    ) {
        return creditBudgetaireService.getCredit(creditId);
    }

    @GetMapping("/exercice/{exerciceId}")
    @ResponseStatus(HttpStatus.OK)
    public List<CreditBudgetaireResponse> getCreditsByExercice(
            @PathVariable String exerciceId
    ) {
        return creditBudgetaireService.getCreditsByExercice(exerciceId);
    }

    @GetMapping("/section/{sectionId}/exercice/{exerciceId}")
    @ResponseStatus(HttpStatus.OK)
    public List<CreditBudgetaireResponse> getCreditsBySection(
            @PathVariable String sectionId,
            @PathVariable String exerciceId
    ) {
        return creditBudgetaireService.getCreditsBySection(sectionId, exerciceId);
    }

    @GetMapping("/programme/{programmeId}")
    @ResponseStatus(HttpStatus.OK)
    public List<CreditBudgetaireResponse> getCreditsByProgramme(
            @PathVariable String programmeId
    ) {
        return creditBudgetaireService.getCreditsByProgramme(programmeId);
    }


    // Révision des montants
    @PatchMapping("/{creditId}/ae")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('REVISER_AE')")
    public void updateAE(
            @PathVariable String creditId,
            @Valid @RequestBody UpdateCreditBudgetaireRequest request
    ) {
        creditBudgetaireService.updateAE(creditId, request);
    }

    @PatchMapping("/{creditId}/cp")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('REVISER_CP')")
    public void updateCP(
            @PathVariable String creditId,
            @Valid @RequestBody UpdateCreditBudgetaireRequest request
    ) {
        creditBudgetaireService.updateCP(creditId, request);
    }


    // Transitions de statut
    @PatchMapping("/{creditId}/engager")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('ENGAGE_DEPENSE')")
    public void engagerCredit(
            @PathVariable String creditId
    ) {
        creditBudgetaireService.commitCredit(creditId);
    }

    @PatchMapping("/{creditId}/bloquer")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('REVISER_AE')")
    public void bloquerCredit(
            @PathVariable String creditId
    ) {
        creditBudgetaireService.freezeCredit(creditId);
    }

    @PatchMapping("/{creditId}/debloquer")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('REVISER_AE')")
    public void debloquerCredit(
            @PathVariable String creditId
    ) {
        creditBudgetaireService.unfreezeCredit(creditId);
    }

    @PatchMapping("/{creditId}/solder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('ENGAGE_DEPENSE')")
    public void solderCredit(
            @PathVariable String creditId
    ) {
        creditBudgetaireService.closeCredit(creditId);
    }

    @PatchMapping("/{creditId}/annuler")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('REVISER_AE')")
    public void annulerCredit(
            @PathVariable String creditId
    ) {
        creditBudgetaireService.cancelCredit(creditId);
    }
}