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
@Table(name = "SOURCE_FINANCEMENT")
public class SourceFinancement extends BaseEntity {

    // 3 caractères — ex: "001", "010"
    @Column(name = "CODE", nullable = false, unique = true, length = 3)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "TYPE_SOURCE", nullable = false)
    private TypeSource typeSource;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;
}