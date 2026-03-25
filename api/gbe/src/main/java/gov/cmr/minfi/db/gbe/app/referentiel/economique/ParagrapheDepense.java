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
@Table(name = "PARAGRAPHE_DEPENSE")
public class ParagrapheDepense extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ARTICLE_ID", nullable = false)
    private ArticleDepense article;

    @Column(name = "CODE_PARAGRAPHE", nullable = false, length = 1)
    private String codeParagraphe;

    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 4)
    private String codeComplet;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.article != null && this.codeParagraphe != null) {
            this.codeComplet = this.article.getCodeComplet() + this.codeParagraphe;
        }
    }
}