"""
OPER RADAR — Fase 1
Lógica de diff entre coletas: decide se um anúncio é novo, continua ativo,
vira candidato a remoção, ou tem sua ausência no portal confirmada.

"removido_confirmado" confirma a ausência em duas coletas consecutivas; não
comprova que o veículo foi vendido.

Regra (ver blueprint, Fase 1 / seção 4 do documento de arquitetura):
  - ausente 1x  -> status = removido_candidato (nao conta ainda)
  - ausente 2x consecutivas -> status = removido_confirmado (data_remocao = 1a ausencia)
  - reapareceu entre a 1a e a 2a checagem -> volta para ativo, contador zera
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Set


@dataclass
class EstadoAnuncio:
    anuncio_portal_id: int
    status: str                 # ativo | removido_candidato | removido_confirmado
    misses_consecutivos: int
    primeira_vez_visto: datetime
    ultima_vez_ativo: datetime
    data_remocao: datetime = None


def processa_diff(
    estado_anterior: Dict[int, EstadoAnuncio],
    ids_ativos_agora: Set[int],
    agora: datetime,
) -> Dict[int, EstadoAnuncio]:
    """Recebe o estado salvo no banco + os IDs vistos na coleta atual, devolve o novo estado.
    Isso roda 1x por revenda a cada execução (07h ou 19h)."""
    novo_estado: Dict[int, EstadoAnuncio] = {}

    # 1) IDs que continuam ou voltaram a aparecer
    for anuncio_id in ids_ativos_agora:
        anterior = estado_anterior.get(anuncio_id)
        if anterior is None:
            # novo anúncio nunca visto
            novo_estado[anuncio_id] = EstadoAnuncio(
                anuncio_portal_id=anuncio_id, status="ativo", misses_consecutivos=0,
                primeira_vez_visto=agora, ultima_vez_ativo=agora,
            )
        else:
            # ativo de novo — mesmo que estivesse candidato a remoção, volta (evita falso positivo)
            novo_estado[anuncio_id] = EstadoAnuncio(
                anuncio_portal_id=anuncio_id, status="ativo", misses_consecutivos=0,
                primeira_vez_visto=anterior.primeira_vez_visto, ultima_vez_ativo=agora,
            )

    # 2) IDs que sumiram desta coleta
    for anuncio_id, anterior in estado_anterior.items():
        if anuncio_id in ids_ativos_agora:
            continue  # já tratado acima
        if anterior.status == "removido_confirmado":
            novo_estado[anuncio_id] = anterior  # já fechado, nada a fazer
            continue

        misses = anterior.misses_consecutivos + 1
        if misses >= 2:
            novo_estado[anuncio_id] = EstadoAnuncio(
                anuncio_portal_id=anuncio_id, status="removido_confirmado",
                misses_consecutivos=misses, primeira_vez_visto=anterior.primeira_vez_visto,
                ultima_vez_ativo=anterior.ultima_vez_ativo,
                data_remocao=anterior.ultima_vez_ativo,  # marca a última vez que esteve ativo
            )
        else:
            novo_estado[anuncio_id] = EstadoAnuncio(
                anuncio_portal_id=anuncio_id, status="removido_candidato",
                misses_consecutivos=misses, primeira_vez_visto=anterior.primeira_vez_visto,
                ultima_vez_ativo=anterior.ultima_vez_ativo,
            )
    return novo_estado


if __name__ == "__main__":
    from datetime import timedelta
    t0 = datetime(2026, 7, 1, 7, 0)

    # Coleta 1 (07h dia 1): 3 anúncios ativos
    estado = processa_diff({}, {100, 101, 102}, t0)
    print("Coleta 1:", {k: v.status for k, v in estado.items()})

    # Coleta 2 (19h dia 1): o 101 sumiu (pode ser instabilidade)
    estado = processa_diff(estado, {100, 102}, t0 + timedelta(hours=12))
    print("Coleta 2:", {k: v.status for k, v in estado.items()})

    # Coleta 3 (07h dia 2): o 101 reaparece -> deve voltar para ativo
    estado = processa_diff(estado, {100, 101, 102}, t0 + timedelta(hours=24))
    print("Coleta 3 (101 reaparece):", {k: v.status for k, v in estado.items()})

    # Coleta 4 (19h dia 2): agora o 102 some de vez
    estado = processa_diff(estado, {100, 101}, t0 + timedelta(hours=36))
    print("Coleta 4 (102 some):", {k: v.status for k, v in estado.items()})

    # Coleta 5 (07h dia 3): 102 continua ausente -> confirma remoção
    estado = processa_diff(estado, {100, 101}, t0 + timedelta(hours=48))
    print("Coleta 5 (102 confirmado removido):", {k: v.status for k, v in estado.items()})
