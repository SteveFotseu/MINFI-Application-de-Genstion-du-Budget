package gov.cmr.minfi.db.gbe.app.referentiel.programmatique;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import gov.cmr.minfi.db.gbe.app.exercice.Exercice;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "OPERATION")
public class Operation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TACHE_ID", nullable = false)
    private Tache tache;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EXERCICE_ID", nullable = false)
    private Exercice exercice;

    @Column(name = "CODE_OPERATION", nullable = false)
    private String codeOperation;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN")
    private String libelleEn;
}