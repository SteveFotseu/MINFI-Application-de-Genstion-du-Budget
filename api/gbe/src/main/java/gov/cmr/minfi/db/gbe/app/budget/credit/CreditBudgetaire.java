package gov.cmr.minfi.db.gbe.app.budget.credit;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import gov.cmr.minfi.db.gbe.app.exercice.Exercice;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.Chapitre;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.Section;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.Action;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.Programme;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(
        name = "CREDIT_BUDGETAIRE",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_credit_imputation",
                columnNames = {
                        "EXERCICE_ID",
                        "SECTION_ID",
                        "PROGRAMME_ID",
                        "ACTION_ID",
                        "CHAPITRE_ID"
                }
        )
)
public class CreditBudgetaire extends BaseEntity
        implements AEManageable, CPManageable, StatutTransitionable {

    // ================================================
    // Classification administrative
    // ================================================
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EXERCICE_ID", nullable = false)
    private Exercice exercice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SECTION_ID", nullable = false)
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROGRAMME_ID", nullable = false)
    private Programme programme;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ACTION_ID", nullable = false)
    private Action action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CHAPITRE_ID", nullable = false)
    private Chapitre chapitre;


    // Code d'imputation budgétaire — calculé
    @Column(name = "CODE_IMPUTATION", nullable = false, unique = true, length = 50)
    private String codeImputation;


    @Column(name = "MONTANT_AE", nullable = false, precision = 20, scale = 2)
    @Builder.Default
    private BigDecimal montantAE = BigDecimal.ZERO;

    @Column(name = "MONTANT_AE_CONSOMME", nullable = false, precision = 20, scale = 2)
    @Builder.Default
    private BigDecimal montantAEConsomme = BigDecimal.ZERO;

    @Column(name = "MONTANT_AE_DISPONIBLE", nullable = false, precision = 20, scale = 2)
    @Builder.Default
    private BigDecimal montantAEDisponible = BigDecimal.ZERO;


    @Column(name = "MONTANT_CP", nullable = false, precision = 20, scale = 2)
    @Builder.Default
    private BigDecimal montantCP = BigDecimal.ZERO;

    @Column(name = "MONTANT_CP_CONSOMME", nullable = false, precision = 20, scale = 2)
    @Builder.Default
    private BigDecimal montantCPConsomme = BigDecimal.ZERO;

    @Column(name = "MONTANT_CP_DISPONIBLE", nullable = false, precision = 20, scale = 2)
    @Builder.Default
    private BigDecimal montantCPDisponible = BigDecimal.ZERO;


    @Enumerated(EnumType.STRING)
    @Column(name = "STATUT", nullable = false)
    @Builder.Default
    private StatutCredit statut = StatutCredit.CANTONNE;


    // Calcul automatique des disponibles à la création
    @PrePersist
    private void initialiserDisponibles() {
        this.montantAEDisponible = this.montantAE;
        this.montantCPDisponible = this.montantCP;
    }


    @Override
    public void consommerAE(BigDecimal montant) {
        if (montant.compareTo(this.montantAEDisponible) > 0) {
            throw new IllegalStateException("Montant AE insuffisant");
        }
        this.montantAEConsomme = this.montantAEConsomme.add(montant);
        this.montantAEDisponible = this.montantAEDisponible.subtract(montant);
    }

    @Override
    public void libererAE(BigDecimal montant) {
        this.montantAEConsomme = this.montantAEConsomme.subtract(montant);
        this.montantAEDisponible = this.montantAEDisponible.add(montant);
    }


    // Implémentation CPManageable
    @Override
    public void consommerCP(BigDecimal montant) {
        if (montant.compareTo(this.montantCPDisponible) > 0) {
            throw new IllegalStateException("Montant CP insuffisant");
        }
        this.montantCPConsomme = this.montantCPConsomme.add(montant);
        this.montantCPDisponible = this.montantCPDisponible.subtract(montant);
    }

    @Override
    public void libererCP(BigDecimal montant) {
        this.montantCPConsomme = this.montantCPConsomme.subtract(montant);
        this.montantCPDisponible = this.montantCPDisponible.add(montant);
    }


    // Implémentation StatutTransitionable
    @Override
    public void bloquer() {
        if (this.statut == StatutCredit.SOLDE || this.statut == StatutCredit.ANNULE) {
            throw new IllegalStateException("Impossible de bloquer un crédit " + this.statut);
        }
        this.statut = StatutCredit.BLOQUE;
    }

    @Override
    public void debloquer() {
        if (this.statut != StatutCredit.BLOQUE) {
            throw new IllegalStateException("Le crédit n'est pas bloqué");
        }
        this.statut = StatutCredit.CANTONNE;
    }

    @Override
    public void annuler() {
        if (this.statut == StatutCredit.SOLDE) {
            throw new IllegalStateException("Impossible d'annuler un crédit soldé");
        }
        this.statut = StatutCredit.ANNULE;
    }

    @Override
    public void solder() {
        if (this.statut != StatutCredit.ENGAGE) {
            throw new IllegalStateException("Seul un crédit engagé peut être soldé");
        }
        this.statut = StatutCredit.SOLDE;
    }

    @Override
    public void engager() {
        if (this.statut != StatutCredit.CANTONNE) {
            throw new IllegalStateException("Seul un crédit cantonné peut être engagé");
        }
        this.statut = StatutCredit.ENGAGE;
    }
}