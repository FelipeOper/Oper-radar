-- OPER RADAR — reverte SOMENTE o que a propagacao por assinatura escreveu.
-- Vinculos manuais e vinculos automaticos proprios (sem motivo 'assinatura ...') nao sao tocados.
-- Rode primeiro o SELECT de conferencia; so depois o UPDATE, em cópia do banco se possivel.

SELECT COUNT(*) AS a_reverter
FROM anuncio
WHERE fipe_assinatura_id IS NOT NULL
  AND fipe_match_motivo LIKE 'assinatura %'
  AND COALESCE(fipe_vinculo_origem, 'automatico') = 'automatico';

UPDATE anuncio
SET fipe_preco_id = NULL,
    fipe_preco_automatico_id = NULL,
    fipe_match_confianca = NULL,
    fipe_match_confianca_automatico = NULL,
    fipe_match_status = 'reprocessar_revertido',
    fipe_match_status_automatico = 'reprocessar_revertido',
    fipe_match_motivo = 'revertido: propagacao por assinatura',
    fipe_match_motivo_automatico = 'revertido: propagacao por assinatura',
    fipe_assinatura_id = NULL
WHERE fipe_assinatura_id IS NOT NULL
  AND fipe_match_motivo LIKE 'assinatura %'
  AND COALESCE(fipe_vinculo_origem, 'automatico') = 'automatico';
