package gov.cmr.minfi.db.gbe.app.referentiel.administratif;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import gov.cmr.minfi.db.gbe.app.exercice.Exercice;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(
        name = "SECTION",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_section_code_exercice",
                columnNames = {"CODE_SECTION", "EXERCICE_ID"}
        )
)
public class Section extends BaseEntity {

    // Code sur 2 caractères — ex: "20", "53", "58", "60"
    @Column(name = "CODE_SECTION", nullable = false, length = 2)
    private String codeSection;

    // Sigle — ex: "MINFI", "PRC", "AN", "MINESEC"
    @Column(name = "SIGLE", length = 20)
    private String sigle;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @Enumerated(EnumType.STRING)
    @Column(name = "TYPE_SECTION")
    private TypeSection typeSection;

    // Une section est toujours dans le contexte d'un exercice budgétaire
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EXERCICE_ID", nullable = false)
    private Exercice exercice;
}