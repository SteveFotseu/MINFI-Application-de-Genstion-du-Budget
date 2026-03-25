package gov.cmr.minfi.db.gbe.app.referentiel.programmatique;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import gov.cmr.minfi.db.gbe.app.exercice.Exercice;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.Section;
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
        name = "PROGRAMME",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_programme_code_exercice",
                columnNames = {"CODE", "EXERCICE_ID"}
        )
)
public class Programme extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SECTION_ID", nullable = false)
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EXERCICE_ID", nullable = false)
    private Exercice exercice;

    // 3 caractères séquentiels — ex: "001", "016", "112"
    @Column(name = "CODE", nullable = false, length = 3)
    private String code;

    // Code composite complet — ex: "58.112", "53.52.01.1"
    @Column(name = "AUTRE_CODE", length = 50)
    private String autreCode;

    // Code de l'exercice — ex: "58" pour 2024, "60" pour 2026
    @Column(name = "CODE_MILLE", length = 5)
    private String codeMille;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN")
    private String libelleEn;

    @Column(name = "ACTIF")
    @Builder.Default
    private boolean actif = true;
}