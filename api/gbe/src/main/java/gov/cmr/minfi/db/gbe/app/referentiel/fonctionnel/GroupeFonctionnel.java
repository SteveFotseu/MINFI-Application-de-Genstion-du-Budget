package gov.cmr.minfi.db.gbe.app.referentiel.fonctionnel;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "GROUPE_FONCTIONNEL")
public class GroupeFonctionnel extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION_ID", nullable = false)
    private DivisionFonctionnelle division;

    // 1 caractère — ex: "1", "2"
    @Column(name = "CODE_GROUPE", nullable = false, length = 1)
    private String codeGroupe;

    // Calculé : codeDivision(2) + codeGroupe(1) = 3 caractères
    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 3)
    private String codeComplet;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.division != null && this.codeGroupe != null) {
            this.codeComplet = this.division.getCodeDivision() + this.codeGroupe;
        }
    }
}