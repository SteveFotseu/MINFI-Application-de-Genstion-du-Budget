package gov.cmr.minfi.db.gbe.app.referentiel.economique;

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
@Table(name = "RUBRIQUE_DEPENSE")
public class RubriqueDepense extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PARAGRAPHE_ID", nullable = false)
    private ParagrapheDepense paragraphe;

    // 1 ou 2 caractères selon les données réelles DGB
    @Column(name = "CODE_RUBRIQUE", nullable = false, length = 2)
    private String codeRubrique;

    // On garde 6 pour couvrir tous les cas — ex: "6227", "61210"
    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 6)
    private String codeComplet;

    @Column(name = "NUM_COMPTE_PCE")
    private Integer numComptePce;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.paragraphe != null && this.codeRubrique != null) {
            this.codeComplet = this.paragraphe.getCodeComplet() + this.codeRubrique;
        }
    }
}