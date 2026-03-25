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
@Table(name = "ARTICLE_DEPENSE")
public class ArticleDepense extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TITRE_ID", nullable = false)
    private TitreDepense titre;

    // 2 caractères — compte principal PCE — ex: "61", "62", "63", "66"
    @Column(name = "CODE_ARTICLE", nullable = false, length = 2)
    private String codeArticle;

    // Calculé : codeTitre(1) + codeArticle(2) = 3 car — ex: "661", "631"
    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 3)
    private String codeComplet;

    // Numéro de compte principal du Plan Comptable de l'État
    @Column(name = "NUM_COMPTE_PCE")
    private Integer numComptePce;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.titre != null && this.codeArticle != null) {
            this.codeComplet = this.titre.getCodeTitre() + this.codeArticle;
        }
    }
}