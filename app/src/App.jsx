import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  LayoutDashboard, LayoutGrid, LineChart as LineChartIcon, Building2, Settings,
  MapPin, Truck, Plus, Trash2, Gauge, Clock, ExternalLink, Search, Send,
  Users, SlidersHorizontal, ShieldCheck, ChevronRight, Menu, X, TrendingDown, TrendingUp
} from 'lucide-react';

const INK = '#EDEAE2';
const INK_MUTED = '#8C8B84';
const BG = '#14171C';
const SURFACE = '#1C2027';
const SURFACE_2 = '#242933';
const SURFACE_3 = '#2C323D';
const BORDER = 'rgba(237,234,226,0.10)';
const AMBER = '#F2A93B';
const RUST = '#D9714F';
const GREEN = '#4FAE7D';
const STEEL = '#5B8AA6';

// Endereço da API PHP publicada no HostGator (ver pasta oper-radar-api/ no repositório).
// Troque pelo domínio real assim que publicar os arquivos — enquanto estiver com o valor
// de exemplo, o app usa os dados de demonstração como fallback automático.
const API_BASE_URL = 'https://agenciaoper.com.br/oper-radar-api';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'anuncios', label: 'Anúncios', icon: LayoutGrid },
  { id: 'analise', label: 'Análise', icon: LineChartIcon },
  { id: 'lojistas', label: 'Lojistas', icon: Building2 },
  { id: 'config', label: 'Config', icon: Settings },
];

const STATE_DATA = [
  ['SP', 'São Paulo', 409], ['PR', 'Paraná', 364], ['SC', 'Santa Catarina', 182], ['MG', 'Minas Gerais', 163],
  ['RS', 'Rio Grande do Sul', 146], ['GO', 'Goiás', 88], ['MT', 'Mato Grosso', 87], ['MS', 'Mato Grosso do Sul', 46],
  ['ES', 'Espírito Santo', 20], ['RJ', 'Rio de Janeiro', 11], ['BA', 'Bahia', 8], ['CE', 'Ceará', 8], ['TO', 'Tocantins', 8],
  ['PE', 'Pernambuco', 6], ['DF', 'Distrito Federal', 5], ['PA', 'Pará', 5], ['RN', 'Rio Grande do Norte', 3],
  ['PB', 'Paraíba', 2], ['PI', 'Piauí', 2], ['RO', 'Rondônia', 2], ['SE', 'Sergipe', 2]
];

// Posições esquemáticas (não são coordenadas geográficas reais) só para o layout
// regional do mapa ilustrativo — cada estado ocupa a posição aproximada da sua região.
const STATE_LAYOUT = {
  RR:[2,0],AP:[4,0],AM:[1,1],PA:[3,1],MA:[5,1],CE:[6.3,1],RN:[7.3,1],
  AC:[0,2],RO:[1,2],TO:[4,2],PI:[5.3,2],PB:[7.3,2],PE:[7,2.7],AL:[7.6,2.7],SE:[7.6,3.2],
  MT:[2,3],BA:[5.5,3],DF:[3.3,3.6],GO:[3,4],MG:[4.3,4.2],ES:[5.6,4.4],
  MS:[2,5],SP:[4,5.1],RJ:[5.6,5.1],
  PR:[3,6],SC:[3.5,6.8],RS:[3,7.6],
};

const SAMPLE_ANUNCIOS = [
  { id: 1, tipo: 'Caminhão', marca: 'Volvo', modelo: 'FH 540 6x4', ano: '2021/2022', km: '312.000', preco: 498000, fipe: 512000, revenda: 'SVD Seminovos', cidade: 'Curitiba', uf: 'PR', ultimaVez: 'hoje, 07h00', status: 'ativo', dias: 34 },
  { id: 2, tipo: 'Implemento', marca: 'Librelato', modelo: 'Graneleira 3 eixos', ano: '2020', km: '—', preco: 145000, fipe: 138000, revenda: 'Rodomarka Implementos', cidade: 'Maringá', uf: 'PR', ultimaVez: 'hoje, 07h00', status: 'ativo', dias: 49 },
  { id: 3, tipo: 'Caminhão', marca: 'Mercedes-Benz', modelo: 'Actros 2651', ano: '2019/2020', km: '480.000', preco: 389000, fipe: 405000, revenda: 'Ingá Veículos', cidade: 'Maringá', uf: 'PR', ultimaVez: '04/07, 19h00', status: 'venda_provavel', dias: 85 },
  { id: 4, tipo: 'Carreta', marca: 'Randon', modelo: 'Sider 3 eixos', ano: '2022', km: '—', preco: 178000, fipe: 171000, revenda: 'Rodoparaná - RANDON', cidade: 'Cascavel', uf: 'PR', ultimaVez: 'hoje, 19h00', status: 'ativo', dias: 16 },
  { id: 5, tipo: 'Caminhão', marca: 'Scania', modelo: 'R 450 A6x2', ano: '2020/2021', km: '395.000', preco: 445000, fipe: 462000, revenda: 'DAF Barigui SJP', cidade: 'São José dos Pinhais', uf: 'PR', ultimaVez: '02/07, 07h00', status: 'removido', dias: 62 },
  { id: 6, tipo: 'Caminhão', marca: 'DAF', modelo: 'XF 480', ano: '2022', km: '198.000', preco: 555000, fipe: 540000, revenda: 'DAF Barigui Curitiba', cidade: 'São José dos Pinhais', uf: 'PR', ultimaVez: 'hoje, 07h00', status: 'ativo', dias: 8 },
];

const SAMPLE_USERS = [
  { nome: 'Felipe', email: 'felipe@rvops.com', papel: 'Admin', status: 'ativo' },
  { nome: 'Ana (comercial)', email: 'ana@rvops.com', papel: 'Analista', status: 'ativo' },
  { nome: 'Marcos (consultor)', email: 'marcos@rvops.com', papel: 'Visualizador', status: 'pendente' },
];

const CUSTOM_FIELDS = [
  { nome: 'Responsável comercial', tipo: 'Texto', aplicaEm: 'Lojistas' },
  { nome: 'Status de negociação', tipo: 'Lista', aplicaEm: 'Lojistas' },
  { nome: 'Prioridade de prospecção', tipo: 'Lista', aplicaEm: 'Lojistas' },
];

const DEALERS = [["LG Caminhões","Almirante Tamandare","PR"],["Mega Carretas - Guerra","Almirante Tamandare","PR"],["Transportadora Matão","Andira","PR"],["Vagarozo Caminhões","Apucarana","PR"],["André Máquinas Agrícolas","Arapongas","PR"],["Disfranco Caminhões","Arapongas","PR"],["Estacionamento Gaúcho","Arapongas","PR"],["GR Máquinas Agrícolas","Arapongas","PR"],["Mercediesel Caminhões","Arapongas","PR"],["Pátio 43","Arapongas","PR"],["Nosso Campo Agriculture - Mahindra - Matriz","Arapoti","PR"],["Agrimaq Máquinas Agrícolas - Stara","Araucaria","PR"],["Global Tratores - John Deere - Araucária","Araucaria","PR"],["Grupo Potencial","Araucaria","PR"],["Michel Car Carros e Caminhões","Araucaria","PR"],["Transnichele Semi-Novos","Araucaria","PR"],["TRUCKCISO","Araucaria","PR"],["Vitrasa Transportes","Araucaria","PR"],["Agro Forte Peças e Equipamentos Agrícolas","Assis Chateaubriand","PR"],["Assis Máquinas","Assis Chateaubriand","PR"],["M.A. Máquinas Agrícolas - Assis Chateaubriand","Assis Chateaubriand","PR"],["Pignata Máquinas e Transportes","Assis Chateaubriand","PR"],["Agrícola Astorga","Astorga","PR"],["Classi.Agrícola","Astorga","PR"],["Tarumã Máquinas Agrícolas e Peças","Astorga","PR"],["5001 Caminhões - Cambé","Cambe","PR"],["Léo.Agro","Cambe","PR"],["Nalin Veículos","Cambe","PR"],["Rodo Sider Paraná","Cambe","PR"],["Terra Forte - Stara","Cambe","PR"],["Turim Diesel - Iveco","Cambe","PR"],["J Lima Transportes","Cambira","PR"],["Zanquetta Agromáquinas","Campina Da Lagoa","PR"],["277 Belamar Caminhões","Campo Largo","PR"],["Campo Largo Tratores","Campo Largo","PR"],["Filipak Transportes","Campo Largo","PR"],["G4 Caminhões","Campo Largo","PR"],["Gobor Seminovos","Campo Largo","PR"],["Rimap","Campo Largo","PR"],["Transportadora Luz Divina","Campo Largo","PR"],["AgroTop Máquinas","Campo Mourao","PR"],["Caminhões Usados Seminovos","Campo Mourao","PR"],["Campal Máquinas","Campo Mourao","PR"],["Indio Bandeira Caminhões","Campo Mourao","PR"],["M.A. Máquinas Agrícolas - Campo Mourão","Campo Mourao","PR"],["Paraná Diesel - MB","Campo Mourao","PR"],["Tornado Tratores","Campo Mourao","PR"],["Zanella Tratores","Campo Mourao","PR"],["Martins Máquinas e Implementos Agrícolas","Candoi","PR"],["Transmakinas","Capanema","PR"],["RPS Agronegócios","Carambei","PR"],["TransArdo","Carambei","PR"],["277 Caminhões","Cascavel","PR"],["BR Máquinas Agrícolas","Cascavel","PR"],["Braun Máquinas Agrícolas","Cascavel","PR"],["Central Agro","Cascavel","PR"],["Contato Caminhões","Cascavel","PR"],["Cromocar Implementos Rodoviários","Cascavel","PR"],["Engmáquinas Agrícolas","Cascavel","PR"],["Formigão Caminhões","Cascavel","PR"],["Ghelere Transportes","Cascavel","PR"],["Icavel Caminhões - VW","Cascavel","PR"],["Librevel - Pastre","Cascavel","PR"],["M.A. Máquinas Agrícolas - Cascavel","Cascavel","PR"],["Metropolitana Tratores - New Holland","Cascavel","PR"],["MG Caminhões","Cascavel","PR"],["Oeste Caminhões","Cascavel","PR"],["Perlin Investimentos","Cascavel","PR"],["Rodocame - Facchini","Cascavel","PR"],["Rodoklone Caminhões e Carretas","Cascavel","PR"],["Rodoparana - RANDON","Cascavel","PR"],["Teixeira Carretas","Cascavel","PR"],["Top 10 Caminhões","Cascavel","PR"],["Transprime Transportes","Cascavel","PR"],["Troppa Carretas","Cascavel","PR"],["Viacam Caminhões","Cascavel","PR"],["Vicente Máquinas Agrícolas","Cascavel","PR"],["Luxe Multimarcas","Castro","PR"],["Paranatrator","Castro","PR"],["Pedrinho Tratores","Castro","PR"],["Rolatrek Implementos Agrícolas - Stara","Castro","PR"],["Agrosolo Máquinas","Chopinzinho","PR"],["Balansin Agronegócios","Chopinzinho","PR"],["Pessette Máquinas Agrícolas","Chopinzinho","PR"],["Cianorte Caminhões","Cianorte","PR"],["M.A. Máquinas Agrícolas - Cianorte","Cianorte","PR"],["Noroeste Máquinas Agrícolas","Cianorte","PR"],["Field Máquinas Agrícolas","Clevelandia","PR"],["Rodricardo Caminhões","Colombo","PR"],["Usina Alto Alegre S/A","Colorado","PR"],["Formula Car Caminhões","Contenda","PR"],["Premio Transportes","Contenda","PR"],["Marson Tratores","Cornelio Procopio","PR"],["Agropec Implementos Agrícolas","Cruz Machado","PR"],["1000 Car","Curitiba","PR"],["5001 Caminhões - Curitiba","Curitiba","PR"],["ACV Caminhões","Curitiba","PR"],["Addiante Seminovos","Curitiba","PR"],["AKS Vidros","Curitiba","PR"],["ALB Caminhões","Curitiba","PR"],["Auto RF Caminhões e Carretas","Curitiba","PR"],["Bebe Caminhões","Curitiba","PR"],["Bruto Equipamentos","Curitiba","PR"],["Caminhão Sul","Curitiba","PR"],["Cecatto Transportes","Curitiba","PR"],["Coroa Implementos Rodoviários","Curitiba","PR"],["DIVELPE Caminhões e Implementos","Curitiba","PR"],["EPV Veículos","Curitiba","PR"],["Erdman Caminhões","Curitiba","PR"],["Financia Frota","Curitiba","PR"],["Garagem 188 Caminhões","Curitiba","PR"],["GM Caminhões","Curitiba","PR"],["Hidropel","Curitiba","PR"],["Jair Caminhões","Curitiba","PR"],["Jandavel Veículos","Curitiba","PR"],["Jorge Caminhões","Curitiba","PR"],["JR Pesados","Curitiba","PR"],["Km Truck","Curitiba","PR"],["LAF Caminhões","Curitiba","PR"],["Lelo Caminhões","Curitiba","PR"],["Linha Verde Caminhões e Máquinas","Curitiba","PR"],["Luciano Negrelli Transportes","Curitiba","PR"],["MacTruck","Curitiba","PR"],["Malinoski Caminhões e Repasses","Curitiba","PR"],["Manica Caminhões","Curitiba","PR"],["Mauloni Veículos","Curitiba","PR"],["Mechanize Máquinas","Curitiba","PR"],["Nórdica Seminovos - Volvo","Curitiba","PR"],["Ônibus e Vans","Curitiba","PR"],["Oto Caminhões","Curitiba","PR"],["Oto Veículos Pesados","Curitiba","PR"],["Pátio 201 Caminhões e Carretas","Curitiba","PR"],["Peregrino Caminhões","Curitiba","PR"],["Petro Kennedy Comércio e Transporte","Curitiba","PR"],["Possoli Multimarcas","Curitiba","PR"],["Ricardo Caminhões Curitiba","Curitiba","PR"],["Ritmo Logística","Curitiba","PR"],["Rivasul Caminhões","Curitiba","PR"],["Rodobras","Curitiba","PR"],["Rodolima Caminhões","Curitiba","PR"],["Rodoparana - RANDON","Curitiba","PR"],["Rota Sul Caminhões","Curitiba","PR"],["RW Caminhões","Curitiba","PR"],["Seminovos Volvo","Curitiba","PR"],["Senador Veículos","Curitiba","PR"],["Só Tanques e Carretas","Curitiba","PR"],["Sten Caminhões","Curitiba","PR"],["SVD Seminovos","Curitiba","PR"],["Transportadora 7 Flexas","Curitiba","PR"],["Transportes Maçaneiro","Curitiba","PR"],["Truck Crane","Curitiba","PR"],["Truck Mais Caminhões e Utilitários","Curitiba","PR"],["Trucket Caminhões","Curitiba","PR"],["Urbano Caminhões","Curitiba","PR"],["Vieira Caminhões","Curitiba","PR"],["Vitória Caminhões","Curitiba","PR"],["Vittorazzi Automóveis","Curitiba","PR"],["Volmak do Brasil","Curitiba","PR"],["M.A. Máquinas Agrícolas - Dois Vizinhos","Dois Vizinhos","PR"],["Vizi Trucks","Dois Vizinhos","PR"],["Gariba Caminhões","Fazenda Rio Grande","PR"],["Liska Veículos","Fazenda Rio Grande","PR"],["Idisa Veículos - MB","Foz Do Iguacu","PR"],["Milani Máquinas","Francisco Beltrao","PR"],["Monte Sião Veículos","Francisco Beltrao","PR"],["Cotramaq Tratores","Goioere","PR"],["Diney Tratores","Goioere","PR"],["M.A. Máquinas Agrícolas - Goioerê","Goioere","PR"],["Boscarioli Implementos","Guaira","PR"],["MaqPrado","Guaira","PR"],["Agro Stadler","Guamiranga","PR"],["Faccin Logística","Guarapuava","PR"],["Maderpel Transportes","Guarapuava","PR"],["Master Campus","Guarapuava","PR"],["MSM Transportes","Guarapuava","PR"],["Rodoparana - RANDON","Guarapuava","PR"],["Silva Veículos","Guarapuava","PR"],["Stoco Caminhões","Guarapuava","PR"],["Tratorsolo - Kunh - Landini","Guarapuava","PR"],["Demarco Equipamentos","Ibipora","PR"],["Eixoforte","Ibipora","PR"],["Sucatão Tratores e Peças","Ibipora","PR"],["Plante Forte Máquinas Agrícolas","Imbituva","PR"],["Europonta","Irati","PR"],["Magparaná - Massey","Irati","PR"],["MPL Agro - Máquinas Agrícolas","Irati","PR"],["Sabiá Máquinas Agrícolas","Irati","PR"],["Serafim Máquinas Agrícolas","Irati","PR"],["Agro Oliveira Máquinas","Iretama","PR"],["Safra Máquinas Agrícolas - GTS","Ivaipora","PR"],["Jatai Tratores","Jataizinho","PR"],["Rodoribeiro Transportes","Jussara","PR"],["LP Transportes","Lapa","PR"],["Trans Barcelona","Lapa","PR"],["Transcar Transportes","Lapa","PR"],["Tratorlar","Laranjeiras Do Sul","PR"],["Agro Niagara","Londrina","PR"],["Agro1000 Tratores","Londrina","PR"],["Comasa Agro - Jacto","Londrina","PR"],["Impacto Caminhões e Carretas","Londrina","PR"],["Indiana Transportes","Londrina","PR"],["Planta Fértil","Londrina","PR"],["SKR Caminhões e Carretas","Londrina","PR"],["Top 100 Máquinas","Londrina","PR"],["Transportadora Real 94","Londrina","PR"],["Vamos Seminovos - Londrina","Londrina","PR"],["JEFF Seminovos - Caminhões e Carretas","Mandirituba","PR"],["M.A. Máquinas Agrícolas - Mangueirinha","Mangueirinha","PR"],["Camtrac Máquinas Agrícolas","Marialva","PR"],["Fioricar Caminhões","Marialva","PR"],["Localiza Seminovos Caminhões - Maringá","Marialva","PR"],["MacPonta Caminhões - DAF","Marialva","PR"],["Rododiesel Seminovos","Marialva","PR"],["Rodolivia Implementos Rodoviários","Marialva","PR"],["Rodoparana - RANDON","Marialva","PR"],["Rodoprime","Marialva","PR"],["Ademir Caminhões","Mariluz","PR"],["Transportes Cristo Vencedor","Mariluz","PR"],["Agiva Máquinas Agrícolas","Maringa","PR"],["Agrima Implementos Agrícolas","Maringa","PR"],["Bortoloto Implementos - Ibiporã","Maringa","PR"],["Drugovich Transportes","Maringa","PR"],["E.P Caminhões","Maringa","PR"],["G10 Seminovos","Maringa","PR"],["Gelatti Financiamentos","Maringa","PR"],["Giro Caminhões","Maringa","PR"],["GP Máquinas Agrícolas","Maringa","PR"],["Gumiero Transportes","Maringa","PR"],["Ingá Veículos - Mercedes Benz Matriz","Maringa","PR"],["Jaloto Transportes","Maringa","PR"],["Marckel Máquinas","Maringa","PR"],["P. B. Lopes - Scania - Maringá PR","Maringa","PR"],["Paranagua Cabines","Maringa","PR"],["Rivesa - Volvo Matriz","Maringa","PR"],["Rodomarka Implementos Rodoviários - Librelato","Maringa","PR"],["Rossini Transportes","Maringa","PR"],["Seminovos Grupo Shark","Maringa","PR"],["Seminovos Hungaro","Maringa","PR"],["Seminovos TDG","Maringa","PR"],["Sul Caminhões","Maringa","PR"],["Taba Carrocerias e Carretas - NOMA","Maringa","PR"],["TransPanorama","Maringa","PR"],["Valek Caminhões","Maringa","PR"],["Ventania Caminhões","Maringa","PR"],["PrimeAgro Máquinas Agrícolas","Mariopolis","PR"],["Libreleste Implementos Rodoviários - Librelato","Marmeleiro","PR"],["Zancan Implementos - Menci do Brasil - Truckvan","Marmeleiro","PR"],["Via Group Seminovos","Matelandia","PR"],["Agrícola Farconde","Maua Da Serra","PR"],["Disam Máquinas - Stara","Medianeira","PR"],["M.A. Máquinas Agrícolas - Medianeira","Medianeira","PR"],["Oestemaq Tratores - Agrale","Medianeira","PR"],["Cetramaq Máquinas","Missal","PR"],["Marc Máquinas","Novo Itacolomi","PR"],["M.A. Máquinas Agrícolas - Palmas","Palmas","PR"],["Carlos Koltun Máquinas","Palmeira","PR"],["HS Máquinas Agrícolas","Palmeira","PR"],["Implemaq - Implementos e Máquinas Agrícolas","Palmeira","PR"],["Auto Máquinas Palotina","Palotina","PR"],["Inovagro - Stara","Palotina","PR"],["M.A. Máquinas Agrícolas - Palotina","Palotina","PR"],["Pizzolotto Máquinas e Implementos Agricolas","Palotina","PR"],["Rodomati Caminhões","Paranavai","PR"],["Carnieletto Máquinas","Pato Branco","PR"],["Giocar Caminhões","Pato Branco","PR"],["Maqforte - Stara - Matriz","Pato Branco","PR"],["Paraná Caminhões - PR","Pato Branco","PR"],["RD Tratores","Paulo Frontin","PR"],["GANA Equipamentos Agricolas","Perola D Oeste","PR"],["JPA Service","Pinhais","PR"],["5001 Caminhões - Ponta Grossa","Ponta Grossa","PR"],["A.M. Máquinas Agrícolas","Ponta Grossa","PR"],["Agro Zeus Máquinas Agrícolas","Ponta Grossa","PR"],["Agromaster Máquinas Agrícolas","Ponta Grossa","PR"],["Alfa Máquinas e Implementos","Ponta Grossa","PR"],["ClubCar Multimarcas","Ponta Grossa","PR"],["Emerson Caminhões","Ponta Grossa","PR"],["Emerson Tratores","Ponta Grossa","PR"],["Grycamp Transportes","Ponta Grossa","PR"],["JB Caminhões","Ponta Grossa","PR"],["Laroca Tratores","Ponta Grossa","PR"],["Laudenir Caminhões","Ponta Grossa","PR"],["Leal BR Transportes","Ponta Grossa","PR"],["LN Caminhões & Parceria Compra Venda e Consignado","Ponta Grossa","PR"],["MacPonta - John Deere","Ponta Grossa","PR"],["MacPonta Caminhões - DAF","Ponta Grossa","PR"],["Pedrinho Carretas","Ponta Grossa","PR"],["Ponta Grossa Caminhões","Ponta Grossa","PR"],["Rodoparana - RANDON","Ponta Grossa","PR"],["Rodoprima Transportes","Ponta Grossa","PR"],["Tratornew S/A - New Holland","Ponta Grossa","PR"],["Trucks Online","Ponta Grossa","PR"],["Comal Comércio de Máquinas Agrícolas","Primeiro De Maio","PR"],["D.K Agronegócios - Máquinas e Implementos Agrícolas","Prudentopolis","PR"],["Inova Agro - Máquinas Agrícolas","Prudentopolis","PR"],["MS Máquinas Agrícolas","Prudentopolis","PR"],["Construcasa Bordignon","Quatigua","PR"],["Chilanti Caminhões","Quatro Barras","PR"],["Pastre - Fabrica","Quatro Barras","PR"],["Lacerda Implementos","Quitandinha","PR"],["M.A. Máquinas Agrícolas - Realeza","Realeza","PR"],["Pivatto Tratores e Máquinas Agrícolas","Realeza","PR"],["CL Angelo Alimentos","Reboucas","PR"],["Baron Implementos","Renascenca","PR"],["Top Truck Caminhões","Reserva","PR"],["Metalesp Implementos","Rio Branco Do Sul","PR"],["Metalesp Seminovos","Rio Branco Do Sul","PR"],["Agricola Bavaria","Rolandia","PR"],["Nutripen Transportes","Rolandia","PR"],["P. M. Muller Maquinas e Implementos Agrícolas","Salto Do Lontra","PR"],["Megatron Transportes","Santo Antonio Do Sudoeste","PR"],["A.H.P Transportes Rodoviários","Sao Jorge Do Ivai","PR"],["AgroBoschi","Sao Jorge Do Ivai","PR"],["5001 Caminhões - São José dos Pinhais","Sao Jose Dos Pinhais","PR"],["Avantte Seminovos","Sao Jose Dos Pinhais","PR"],["Axon Logística","Sao Jose Dos Pinhais","PR"],["Baú Tarumã","Sao Jose Dos Pinhais","PR"],["Caio Baterias","Sao Jose Dos Pinhais","PR"],["Caio Caminhões","Sao Jose Dos Pinhais","PR"],["CWB Caminhões","Sao Jose Dos Pinhais","PR"],["DAF Barigui Curitiba","Sao Jose Dos Pinhais","PR"],["DAF Barigui SJP","Sao Jose Dos Pinhais","PR"],["Ebema Caminhões","Sao Jose Dos Pinhais","PR"],["Florença Caminhões - Iveco","Sao Jose Dos Pinhais","PR"],["Geração Caminhões e Carretas","Sao Jose Dos Pinhais","PR"],["Império Caminhões","Sao Jose Dos Pinhais","PR"],["JDM Caminhões","Sao Jose Dos Pinhais","PR"],["João Lima Caminhões","Sao Jose Dos Pinhais","PR"],["JR Vieira Caminhões","Sao Jose Dos Pinhais","PR"],["Multitrucks Seminovos","Sao Jose Dos Pinhais","PR"],["Nilson Caminhoes","Sao Jose Dos Pinhais","PR"],["PerfiLog Logística e Transportes","Sao Jose Dos Pinhais","PR"],["Promotor de Vendas CDS","Sao Jose Dos Pinhais","PR"],["SelecTrucks - Curitiba PR","Sao Jose Dos Pinhais","PR"],["SIPAL Implementos - NOMA","Sao Jose Dos Pinhais","PR"],["TB Trucks","Sao Jose Dos Pinhais","PR"],["Transgires - SJP","Sao Jose Dos Pinhais","PR"],["Vamos Seminovos - São José dos Pinhais","Sao Jose Dos Pinhais","PR"],["Nalmaq Máquinas Agrícolas","Sao Mateus Do Sul","PR"],["JK Caminhões PR","Sarandi","PR"],["Rural Vendas","Terra Roxa","PR"],["Agropax Máquinas Agrícolas","Tibagi","PR"],["JZ Implementos Agrícolas","Toledo","PR"],["Lago Máquinas e Peças Agrícolas","Toledo","PR"],["M.A. Máquinas Agrícolas - Toledo","Toledo","PR"],["Maroso Caminhões","Toledo","PR"],["Puchalski Implementos Rodoviários","Toledo","PR"],["Terra Mais Implementos Agrícolas","Toledo","PR"],["Toledo Tratores PR","Toledo","PR"],["Verenka Implementos Agrícolas","Turvo","PR"],["M.A. Máquinas Agrícolas - Ubiratã","Ubirata","PR"],["Tratorpeças Máquinas - Stara","Ubirata","PR"],["Edmilson Caminhões Usados","Umuarama","PR"],["Furlan Caminhões","Umuarama","PR"],["Furlan Carrocerias e Implementos","Umuarama","PR"],["JS Metal Forja","Umuarama","PR"],["Luizão Máquinas Agrícolas","Umuarama","PR"],["M.A. Máquinas Agrícolas - Umuarama","Umuarama","PR"],["Realiza Caminhões - Umuarama","Umuarama","PR"],["Tratorama Máquinas e Implementos","Umuarama","PR"],["Agro Texas Máquinas Agrícolas","Vitorino","PR"],["Agromaq","Vitorino","PR"],["M.A. Máquinas Agrícolas - Vitorino","Vitorino","PR"],["3F Caminhões & Carretas","Concordia","SC"],["4K Caminhões - Chapecó","Chapeco","SC"],["4K Caminhões - Itajaí","Itajai","SC"],["4X4 Caminhões e Carretas","Concordia","SC"],["Acelera Brasil - Caminhões e Máquinas","Lages","SC"],["AD Carretas","Joinville","SC"],["Agostini Caminhões e Peças","Sao Miguel Do Oeste","SC"],["Agricopel","Jaragua Do Sul","SC"],["Agrocomercial Rudnik - Landini","Itaiopolis","SC"],["Agro NZ Comercial Agrícola","Fraiburgo","SC"],["AG RSL","Rio Do Sul","SC"],["Ala Forte Implementos Rodoviários","Chapeco","SC"],["American Oil","Lages","SC"],["Andrei Veículos e Caminhões","Palhoca","SC"],["Ascari Caminhões","Orleans","SC"],["AW Caminhões","Itajai","SC"],["B2 Logistica","Concordia","SC"],["Bandoch Implementos Rodoviários","Sao Bento Do Sul","SC"],["Batista Caminhões","Palhoca","SC"],["Bauer Caminhões","Itajai","SC"],["BeAgro Comércio de Máquinas e Equipamentos Agrícolas - Yanmar Solis","Videira","SC"],["Blu Star Caminhões - MB","Indaial","SC"],["B. Nunes Logística","Orleans","SC"],["Brazdiesel Caminhões","Joinville","SC"],["Breitkopf Caminhões - VW","Joinville","SC"],["Breitkopf Caminhões - VW","Itajai","SC"],["BR Implementos - NOMA","Cordilheira Alta","SC"],["BST Caminhões","Tijucas","SC"],["Buratto Caminhões e Camionetas","Lages","SC"],["Buratto Carretas","Orleans","SC"],["C2S Caminhões","Videira","SC"],["Capital Caminhões e Carrocerias","Concordia","SC"],["Carboni Iveco","Videira","SC"],["Chapecó Baús","Chapeco","SC"],["Chapecó Caminhões","Cordilheira Alta","SC"],["Cidimar Tratores","Sao Miguel Do Oeste","SC"],["Claudio Caminhões","Indaial","SC"],["Cleber Caminhões","Cocal Do Sul","SC"],["Compac Implementos Rodoviários - Librelato","Icara","SC"],["Compasi Implementos Rodoviários - RANDON","Xanxere","SC"],["Conlog - Itajaí","Itajai","SC"],["Constancio Transportes","Gaspar","SC"],["Cordenonsi Seminovos","Xaxim","SC"],["Credi Caminhões e Financiamentos","Itapoa","SC"],["Cristiano Caminhões","Sao Jose","SC"],["DAF Barigui Chapecó Cordilheira Alta","Cordilheira Alta","SC"],["DAF Barigui Itajaí","Itajai","SC"],["Dicave Viking Center - Volvo","Itajai","SC"],["Dico Caminhões","Rio Do Sul","SC"],["Dimas Caminhões","Sao Jose","SC"],["Disville Caminhões","Araquari","SC"],["Divisa Caminhões","Indaial","SC"],["Doca Máquinas Agrícolas","Fraiburgo","SC"],["DV Caminhões","Icara","SC"],["Edson Máquinas","Sao Domingos","SC"],["Engectra Transportes","Icara","SC"],["Enova Implementos Rodoviários","Caibi","SC"],["Erasmo Caminhões","Tubarao","SC"],["Esfera Seminovos","Braco Do Norte","SC"],["Extra Caminhões","Concordia","SC"],["Fazenda São Rafael","Itaiopolis","SC"],["Fenix Implementos Rodoviários - Olivo","Videira","SC"],["Foresti Tratores","Maravilha","SC"],["Foroeste Caminhões - Foton","Chapeco","SC"],["Freccia Caminhões","Jaguaruna","SC"],["Furgões Concordia","Concordia","SC"],["Futuro Máquinas","Itajai","SC"],["G7 Seminovos","Tubarao","SC"],["Gatelli Seminovos","Catanduvas","SC"],["GH Seminovos","Itajai","SC"],["Guisolphi Caminhões","Xanxere","SC"],["Incobel","Lages","SC"],["Ita Caminhões","Palmitos","SC"],["Itajai Caminhões","Navegantes","SC"],["Januário Comércio","Turvo","SC"],["JC Veículos e Caminhões","Santo Amaro Da Imperatriz","SC"],["Joinville Implementos","Garuva","SC"],["Jost Caminhões","Concordia","SC"],["Kades Central De Máquinas","Cacador","SC"],["Kaio Caminhões","Lages","SC"],["Kandir Transportes","Araquari","SC"],["Korea Tratores - Ls Tractor","Chapeco","SC"],["Lau Caminhões","Itajai","SC"],["Lenagro - Case","Campos Novos","SC"],["Léo Buratto Caminhões","Lages","SC"],["LP Caminhões","Canoinhas","SC"],["Ludvig Seminovos","Joinville","SC"],["Magal Seminovos","Tubarao","SC"],["Magnabosco Seminovos","Catanduvas","SC"],["Mallon Truck Seminovos - MB","Mafra","SC"],["Mano Caminhões","Joinville","SC"],["Marcofrigo Implementos Rodoviários","Concordia","SC"],["Marcolla Caminhões","Blumenau","SC"],["Marcon Caminhões","Chapeco","SC"],["Margotti Caminhões","Tubarao","SC"],["Mendes Caminhões","Presidente Getulio","SC"],["Mevale - Scania","Itajai","SC"],["Miltex Transportes","Chapeco","SC"],["MMG Caminhões","Guaramirim","SC"],["Mollmann Implementos","Concordia","SC"],["Monteiro Caminhões","Icara","SC"],["MULTILOG","Itajai","SC"],["Munaretto Caminhões","Lages","SC"],["Naco Caminhões","Canelinha","SC"],["Napalha - John Deere - Matriz","Campos Novos","SC"],["Natyva Caminhões","Orleans","SC"],["NG Caminhões","Tijucas","SC"],["NZ Veículos e Caminhões","Icara","SC"],["Odelli Caminhões","Rio Do Sul","SC"],["Oeste Caminhões","Cordilheira Alta","SC"],["Orsi Representações","Itajai","SC"],["Ouro Preto Caminhões","Lages","SC"],["Pagno Caminhões","Iomere","SC"],["Palmeira Implementos","Joinville","SC"],["Patrolão Máquinas","Maravilha","SC"],["Patrolão Peças","Maravilha","SC"],["Peregrina Seminovos","Icara","SC"],["Pesados Blumenau","Blumenau","SC"],["Planjo Máquinas Agrícolas","Campos Novos","SC"],["Portal Caminhões","Rio Do Sul","SC"],["Portal Log","Luzerna","SC"],["Primos Caminhões","Icara","SC"],["RB Veículos","Palhoca","SC"],["Redivo Caminhões","Tubarao","SC"],["Reforce Implementos Rodoviários","Joinville","SC"],["Rei da Batata Caminhões","Blumenau","SC"],["RF Implementos","Icara","SC"],["Rodima Equipamentos Rodoviários - Guerra","Biguacu","SC"],["Rodo Baldessar Equipamentos Rodoviários","Otacilio Costa","SC"],["Rodocar Caminhões","Chapeco","SC"],["Rodocatarina - Librelato","Itajai","SC"],["Rodoeverton Seminovos","Jaguaruna","SC"],["Rodomac Tratores - New Holland","Sao Miguel Do Oeste","SC"],["Rodomini Transportes","Itajai","SC"],["RodoMuller Implementos Agrícolas e Rodoviários","Lauro Muller","SC"],["Rodo Serra Caminhões e Carretas","Lages","SC"],["Rodosul Caminhões","Rio Do Sul","SC"],["Rodosul Implementos Rodoviários","Ituporanga","SC"],["São Cristóvão Caminhões","Sao Jose","SC"],["SC Caminhões","Balneario Camboriu","SC"],["Schroeder Caminhões","Ituporanga","SC"],["SC Trucks e Carretas","Videira","SC"],["SelecTrucks - Içara SC","Icara","SC"],["Seraglio - Guerra","Xanxere","SC"],["Silva Tratores - Agritech","Ituporanga","SC"],["Silvio Caminhões","Tubarao","SC"],["Simon Seminovos","Imbituba","SC"],["Sohnway Representações","Joinville","SC"],["Sol Máquinas","Fraiburgo","SC"],["SS Caminhões","Sao Miguel Do Oeste","SC"],["Sul Caminhões","Sao Joao Do Sul","SC"],["Sul Norte - Mahindra","Papanduva","SC"],["Tesba Transportes","Tubarao","SC"],["TNH Seminovos","Imbituba","SC"],["TNZ Caminhões Multimarcas","Icara","SC"],["Toni Cerealista - Landini","Irineopolis","SC"],["Tranorte - John Deere","Mafra","SC"],["Transal Transportes","Morro Da Fumaca","SC"],["Transgires","Canoinhas","SC"],["TransMasi Transportes","Icara","SC"],["Transportadora Ociani","Blumenau","SC"],["Transportes Ari","Campo Alegre","SC"],["Transportes Baggeto","Orleans","SC"],["Transportes Marvel","Chapeco","SC"],["Transportes Piaseski","Jaragua Do Sul","SC"],["Transportes Rizzi","Irani","SC"],["Transportes Silvio","Concordia","SC"],["Transportes Treméa","Xaxim","SC"],["Transpower Transporte Rodoviário","Cacador","SC"],["Transprim Transportes","Rio Do Sul","SC"],["Transrima Transportes","Concordia","SC"],["Tratorvila Tratores e Maquinas","Icara","SC"],["Trevo Caminhões - AGB","Itajai","SC"],["Valentim Caminhões","Itajai","SC"],["Vamos Seminovos - Chapecó","Chapeco","SC"],["Vamos Seminovos - Itajaí","Itajai","SC"],["Via Oeste Caminhões","Blumenau","SC"],["Videira Implementos Rodoviários","Videira","SC"],["Vip Truck Multimarcas","Icara","SC"],["Vo Aldo Transportes","Xanxere","SC"],["W.Breitkopf - VW","Blumenau","SC"],["WR Caminhões","Tubarao","SC"],["113 Caminhões","Campinas","SP"],["13 Caminhões","Aracatuba","SP"],["2F Caminhões","Ribeirao Preto","SP"],["2 Japão Caminhões e Carretas","Sumare","SP"],["4000 Caminhões","Campinas","SP"],["4A Caminhões","Araras","SP"],["4K Caminhões - Araras","Araras","SP"],["4R Caminhões","Lorena","SP"],["52 Caminhões e Carretas","Sao Jose Do Rio Preto","SP"],["5 Star Trucks","Sumare","SP"],["Accord Veículos","Franca","SP"],["Agência Junior Caminhões","Ribeirao Preto","SP"],["Agricolas e Cia","Rio Das Pedras","SP"],["Agrícola Usadão","Taquarituba","SP"],["Agrifort","Araraquara","SP"],["Agrifram Máquinas e Soluções Agrícolas","Franca","SP"],["AgriVamos - Vamos Seminovos","Ribeirao Preto","SP"],["AGROBILL Tratores & Implementos Agrícolas","Saltinho","SP"],["Agro Mogi Peças e Equipamentos Agrícolas","Mogi-Mirim","SP"],["Agro Novaes Máquinas Agrícolas","Fernandopolis","SP"],["Agroterra Pulverizadores","Araras","SP"],["Agua Clara Caminhões","Itapeva","SP"],["AJR Transportes","Praia Grande","SP"],["Alex Ozório Caminhões","Sao Jose Dos Campos","SP"],["Aliança Multimarcas Tratores","Ubirajara","SP"],["Almeida Agrícola","Sao Miguel Arcanjo","SP"],["Alves Bazzoli Transportes","Salto Grande","SP"],["Americana Caminhões","Americana","SP"],["AMR Caminhões","Jundiai","SP"],["Arara Azul Máquinas","Mogi Das Cruzes","SP"],["Araraquara Caminhões","Araraquara","SP"],["Araras Tratores","Araras","SP"],["Arjona Caminhões","Cravinhos","SP"],["Assisty Transportes","Araraquara","SP"],["Ativa Caminhões","Catanduva","SP"],["Auto Minas Caminhões","Ribeirao Preto","SP"],["Autovia Caminhões","Araraquara","SP"],["Av Cred Caminhões","Piedade","SP"],["Avenida Caminhões","Brodowski","SP"],["AWP Log","Bertioga","SP"],["Azevedo Caminhões","Americana","SP"],["Azzioly Caminhões","Mogi Das Cruzes","SP"],["Bacci Motors","Sao Jose Dos Campos","SP"],["Bandeira Transportes","Salto De Pirapora","SP"],["Barão Bus","Sao Paulo","SP"],["Barella Caminhões","Osasco","SP"],["Batatais Caminhões","Batatais","SP"],["Batisfon Transportes","Indaiatuba","SP"],["BC Caminhões Seminovos","Ribeirao Preto","SP"],["Beto Caminhões Piracicaba","Americana","SP"],["Bill Agronegócios","Saltinho","SP"],["BLR Transportes","Carapicuiba","SP"],["Blue Transportes","Itupeva","SP"],["BM Carretas","Lencois Paulista","SP"],["Bordin Veículos","Sao Bernardo Do Campo","SP"],["BPX Transportes","Sao Roque","SP"],["Brasilmaxi Logística","Sao Paulo","SP"],["Braspress Transportes Urgentes","Guarulhos","SP"],["Bruscagin Transportes","Americana","SP"],["Campo Tratores","Sao Carlos","SP"],["Canaã Carretas e Implementos Rodoviários","Ourinhos","SP"],["Caproni Máquinas e Geradores","Santo Andre","SP"],["Carga Pesada Caminhões","Sao Paulo","SP"],["Cargotran","Barueri","SP"],["Carlos Tratores SP","Guaira","SP"],["Carreta Fácil","Ribeirao Preto","SP"],["Carvalho Transportes","Sao Jose Dos Campos","SP"],["Cattrucks","Aruja","SP"],["Central Máquinas - Case","Assis","SP"],["Cerbasi Caminhões e Carretas","Lencois Paulista","SP"],["Cesar Caminhões","Sao Joao Da Boa Vista","SP"],["CLA Caminhões e Veículos","Jundiai","SP"],["CMG Logística","Itu","SP"],["Codema Seminovos - Scania","Guarulhos","SP"],["Cofipe Veículos - Iveco","Sao Paulo","SP"],["Colorado Seminovos","Ribeirao Preto","SP"],["Comando Diesel Transporte e Logística","Boituva","SP"],["Comovel Comercial Montealtense de Veículos","Monte Alto","SP"],["Companheiro Caminhões","Amparo","SP"],["Comper Tratores - Mahindra","Araraquara","SP"],["Conlog - São Paulo","Paulinia","SP"],["Consulting Agro","Ituverava","SP"],["Convem Consignação de Veículos e Máquinas","Jales","SP"],["Credicar Automóveis","Guaratingueta","SP"],["Crisão Caminhões","Sorocaba","SP"],["Cristiano Caminhões e Carretas","Sao Jose Do Rio Pardo","SP"],["CSN Comércio de Veículos","Limeira","SP"],["DAF Caminho Caminhões - Araçatuba","Aracatuba","SP"],["DAF Caminho Caminhões - Araraquara","Araraquara","SP"],["DAF Caminho Caminhões - Ribeirão Preto","Ribeirao Preto","SP"],["DAF Caminho Caminhões - São José do Rio Preto","Sao Jose Do Rio Preto","SP"],["Danilo Agro","Limeira","SP"],["Dante Implementos Rodoviários e Transportes","Araraquara","SP"],["D. Carvalho - John Deere","Aracatuba","SP"],["De Nigris - MB","Sao Paulo","SP"],["De Santi Caminhões","Ribeirao Preto","SP"],["De Santi Carretas","Cravinhos","SP"],["Detroit Caminhões","Sao Jose Dos Campos","SP"],["Dibracam VW - Santo André - Matriz","Santo Andre","SP"],["Dismac - Peças Agrícolas","Araras","SP"],["Divena Comercial Seminovos - Mercedes Benz","Barueri","SP"],["DKM Caminhões","Aracatuba","SP"],["Dovigo Tratores","Artur Nogueira","SP"],["DRZ Motors","Jundiai","SP"],["DSM Caminhões","Guararema","SP"],["Dutra Caminhões","Sao Paulo","SP"],["Edu Caminhões","Sao Paulo","SP"],["Ellite Implementos Rodoviários","Paulinia","SP"],["E-Machine Comercial S.A.","Sertaozinho","SP"],["ER Seminovos","Atibaia","SP"],["Estevão Caminhões","Osvaldo Cruz","SP"],["Everaldo Caminhões","Mogi Guacu","SP"],["Evolução Truck","Guarulhos","SP"],["Expresso Artioli","Colina","SP"],["ExtraPesado Caminhões","Santo Andre","SP"],["FassiTruck","Sao Paulo","SP"],["Fatelog","Sao Bernardo Do Campo","SP"],["FBM Caminhões","Monte Alto","SP"],["FCV Caminhões","Sao Paulo","SP"],["Fernandes Amadeu Transportes","Nova Granada","SP"],["FF Caminhões Ribeirão Preto","Ribeirao Preto","SP"],["FK Carretas","Limeira","SP"],["Fort Carretas e Locações","Cravinhos","SP"],["Fortrac - New Holland","Piracicaba","SP"],["FS Caminhões","Piedade","SP"],["Futuro Cereais","Pilar Do Sul","SP"],["G3 Cargas","Monte Mor","SP"],["Galdino Caminhões","Sumare","SP"],["Galpão Caminhões","Monte Mor","SP"],["Gama Caminhões e Utilitários","Catanduva","SP"],["G.A.S. Transportes","Jundiai","SP"],["Gazola Caminhões","Sao Jose Do Rio Preto","SP"],["Gil Caminhões","Araraquara","SP"],["Gimenes Caminhões","Sumare","SP"],["GP Trucks","Piracicaba","SP"],["Gran Cargo","Guarulhos","SP"],["Grandim Máquinas Agrícolas","Campinas","SP"],["Grillo Caminhões","Iracemapolis","SP"],["GS Transportes","Novo Horizonte","SP"],["Hamilton Caminhões","Limeira","SP"],["HF Transportadora","Indaiatuba","SP"],["Hora-Agro Máquinas","Ribeirao Preto","SP"],["Horizonte Transportes","Jose Bonifacio","SP"],["Huma Transportes","Descalvado","SP"],["IC Seminovos","Sumare","SP"],["Igarapava Tratores - Budny","Igarapava","SP"],["Intersul Caminhões","Sao Paulo","SP"],["Itália Caminhões","Ribeirao Preto","SP"],["Ituvel Veículos e Máquinas","Itu","SP"],["Jade Transportes - Matriz","Campinas","SP"],["Jaime Caminhões","Ribeirao Preto","SP"],["JJ Vieira Transportes","Votuporanga","SP"],["JL Implementos Rodoviários","Barretos","SP"],["JL Transporte","Assis","SP"],["J.M Guaçu Caminhões","Mogi Guacu","SP"],["JMM Logistica","Ribeirao Preto","SP"],["JM Tratores","Adamantina","SP"],["Jr Bozolan & Filhos","Aracatuba","SP"],["JR Caminhão","Indaiatuba","SP"],["JSL Seminovos","Itaquaquecetuba","SP"],["Jucimar Utilitários e Caminhões","Sao Bernardo Do Campo","SP"],["Kaumarc Caminhões","Sao Paulo","SP"],["K LOG Caminhões","Sumare","SP"],["KL Tratores","Penapolis","SP"],["Km 307 Caminhões","Ribeirao Preto","SP"],["Kona Transportes","Jundiai","SP"],["Lago Azul Tratores","Morro Agudo","SP"],["Lance Caminhões e Carretas","Limeira","SP"],["Leandrão Caminhões","Jundiai","SP"],["Lemar Transportes","Osasco","SP"],["Leque Caminhões","Piracicaba","SP"],["LF Máquinas Agrícolas SP","Miguelopolis","SP"],["LG Máquinas e Caminhões","Sumare","SP"],["Limeira Tratores","Limeira","SP"],["LM Caminhões","Cajamar","SP"],["Lobo Caminhões","Piracicaba","SP"],["Localiza Seminovos Pesados - Campinas","Campinas","SP"],["Localiza Seminovos Pesados - Ribeirão Preto","Ribeirao Preto","SP"],["Lotrans","Mogi Guacu","SP"],["Lots Group","Presidente Prudente","SP"],["LS 7 Caminhões","Limeira","SP"],["Luizinho Caminhões","Leme","SP"],["Luizinho Tratores","Ituverava","SP"],["MacPonta Caminhões - DAF - SP","Sumare","SP"],["Macri Implementos Rodoviários - Librelato","Ourinhos","SP"],["Maggi Caminhões - VW","Itu","SP"],["Magripel Tratores e Implementos","Araras","SP"],["Makes - São Miguel","Sao Miguel Arcanjo","SP"],["MAM Caminhões","Itatiba","SP"],["Mana Máquinas","Ribeirao Preto","SP"],["Manoel Tratores","Catanduva","SP"],["Maranata Carrocerias e Reboques","Votuporanga","SP"],["Marcelo Carretas e Caminhões","Regente Feijo","SP"],["Marcos Scur Implementos - Rodotécnica","Sao Paulo","SP"],["Marka Veículos - VW","Jau","SP"],["Maroni","Sao Paulo","SP"],["Martelozo Caminhões","Campinas","SP"],["Massa Caminhões","Sao Manuel","SP"],["Mative Equipamentos Agrícolas","Martinopolis","SP"],["Mattei Caminhões","Cravinhos","SP"],["Mauro Simonetti Seminovos","Botucatu","SP"],["Medeiros Caminhões","Presidente Prudente","SP"],["Mega Mogi Caminhões","Mogi Das Cruzes","SP"],["M H Caminhões","Embu","SP"],["Michel Transportes","Altinopolis","SP"],["Millenium Transportes","Osasco","SP"],["Mister Truck Semi Novos","Sao Jose Do Rio Preto","SP"],["Montemag Tratores","Monte Mor","SP"],["Morais Almeida Seminovos","Cravinhos","SP"],["Moreira Caminhões","Cravinhos","SP"],["Mossin Caminhões","Sertaozinho","SP"],["M Tirapu Transportes","Apiai","SP"],["Mugen Caminhões","Guarulhos","SP"],["MultiTruck Caminhões e Implementos","Presidente Prudente","SP"],["Mundial Caminhões e Carretas","Palmital","SP"],["Mundo dos Caminhões","Sumare","SP"],["MZ Implementos e Peças","Jau","SP"],["Nac Caminhões","Atibaia","SP"],["Nene Caminhões","Sao Joao Da Boa Vista","SP"],["Nery Caminhões N.C.V.","Sao Paulo","SP"],["New Truck Veículos e Peças","Guarulhos","SP"],["Nino Caminhões","Campinas","SP"],["Nogueira Máquinas Agrícolas","Uchoa","SP"],["Noroeste Tratores","Votuporanga","SP"],["Nors Caminhões e Ônibus Brasil São Paulo","Sao Paulo","SP"],["Nova Sinal Caminhões","Jundiai","SP"],["Novo Campo Comercial","Jaboticabal","SP"],["Octabel - Stara","Ribeirao Preto","SP"],["Onze Rodas Caminhões e Utilitários","Itatiba","SP"],["Original Tratores","Pindorama","SP"],["Ottoboni Máquinas - New Holland","Dracena","SP"],["Pacar Transportes","Catanduva","SP"],["Panda Caminhões","Lorena","SP"],["Paraíso Pesados","Aracariguama","SP"],["Patrono Transportes","Presidente Prudente","SP"],["Paulinia Equipamentos","Paulinia","SP"],["Paulistana Carretas","Sao Paulo","SP"],["Paulista Transportes","Itapeva","SP"],["Paulo Mincarone Caminhões","Sao Paulo","SP"],["Pedrotti Implementos Rodoviários - Guerra","Salto Grande","SP"],["Peres Diesel - MB","Araraquara","SP"],["Pesados Net","Sao Bernardo Do Campo","SP"],["Pessatti Seminovos","Cordeiropolis","SP"],["Piovan Máquinas Pesadas e Implementos","Ribeirao Preto","SP"],["Pira Tratores","Avare","SP"],["Piratruck Implementos Rodoviários - Guerra","Piracicaba","SP"],["Porto Caminhões","Guarulhos","SP"],["Porto Caminhões","Porto Ferreira","SP"],["Posto Santa Cecilia","Botucatu","SP"],["Prime Multimarcas","Sao Paulo","SP"],["Privilege Transportes","Ribeirao Preto","SP"],["Quarta Parada Caminhões","Sao Paulo","SP"],["Quarto Eixo Caminhões","Campinas","SP"],["Quintal dos Caminhões","Sumare","SP"],["R29 Caminhões","Iracemapolis","SP"],["Raça Transportes","Itapecerica Da Serra","SP"],["Racine Tratores - Case","Jau","SP"],["Radar Rural","Vera Cruz","SP"],["Radar Rural","Vera Cruz","SP"],["Radavelli Caminhões","Matao","SP"],["Ravel Trucks","Cravinhos","SP"],["RC Caminhões","Sao Jose Do Rio Preto","SP"],["RDS Soluções em Caminhões e Máquinas","Sao Paulo","SP"],["RD Tratores - Itapolis","Itapolis","SP"],["Real Cred Caminhões","Piedade","SP"],["Rebocks","Limeira","SP"],["Red Box Transportes","Guarulhos","SP"],["Red Lake","Sao Paulo","SP"],["Rei dos Tratores","Sao Jose Do Rio Preto","SP"],["Reinaldo Caminhões","Araraquara","SP"],["Reis Diesel Carretas","Guarulhos","SP"],["Renato Trator","Ibitinga","SP"],["Renato Tratores","Sertaozinho","SP"],["Renova JBS","Sao Paulo","SP"],["Revemasa","Batatais","SP"],["Revenda Ambev - Conebel","Sao Jose Do Rio Preto","SP"],["Revenda Ambev - Imaruí Litoral","Caraguatatuba","SP"],["Rio Pardo Caminhões e Tratores","Sao Jose Do Rio Pardo","SP"],["Rio Preto Caminhões","Sao Jose Do Rio Preto","SP"],["Riva Caminhões e Carretas","Catanduva","SP"],["Robinson Caminhões Multimarcas","Porto Ferreira","SP"],["Rodam Caminhões","Sao Bernardo Do Campo","SP"],["Rodobinho Transportes","Urupes","SP"],["Rodonaves Seminovos","Ribeirao Preto","SP"],["Rodorib Rio Brasil - SJRP","Sao Jose Do Rio Preto","SP"],["Rodozan Implementos Rodoviários - Librelato","Itapetininga","SP"],["Rodrigão Carretas","Olimpia","SP"],["Rodrigues Caminhões","Bady Bassitt","SP"],["Rogério Caminhões","Sao Bernardo Do Campo","SP"],["Roma Tratores","Presidente Prudente","SP"],["Rondon Caminhões Bauru","Bauru","SP"],["Roque de Moraes Caminhões","Vargem Grande Paulista","SP"],["Rossini Caminhões","Sao Bernardo Do Campo","SP"],["Rota 61 Veículos","Jundiai","SP"],["Rota Caminhões","Sumare","SP"],["RP Comércio de Caminhões","Macatuba","SP"],["RP Trucks","Cravinhos","SP"],["RSR Veículos Pesados","Sao Paulo","SP"],["RT Caminhões","Sumare","SP"],["R.Torquato Negócios","Sao Jose Do Rio Preto","SP"],["Sanjoanense Veículos","Limeira","SP"],["Santin Empresa de Transportes Especiais","Americo Brasiliense","SP"],["Santo André Máquinas","Pirassununga","SP"],["Santos Representações","Santos","SP"],["SB Veiculos","Catanduva","SP"],["Scan Oeste","Osvaldo Cruz","SP"],["SelecTrucks - Limeira SP","Limeira","SP"],["SelecTrucks - São Bernardo do Campo SP - Matriz","Sao Bernardo Do Campo","SP"],["Seminovos GT","Guarulhos","SP"],["Seminovos Lapônia","Itu","SP"],["Seminovos WLM Quinta Roda","Sumare","SP"],["Silveira Veículos","Piedade","SP"],["Silvério Veículos","Monte Alto","SP"],["Sinal Verde Caminhões","Sao Paulo","SP"],["Siqueira Caminhões","Braganca Paulista","SP"],["Só Agrícola Máquinas e Peças","Barretos","SP"],["SóKarretas","Paulinia","SP"],["Sol Caminhões e Utilitários","Sao Paulo","SP"],["Souza Neto Tratores e Implementos","Sao Manuel","SP"],["Space Agro Plis","Penapolis","SP"],["SP Caminhões","Sao Paulo","SP"],["SP Tratores","Descalvado","SP"],["SRF Caminhões - SP","Sao Jose Do Rio Preto","SP"],["Stéfani - Massey Ferguson","Jaboticabal","SP"],["ST Seminovos","Sao Paulo","SP"],["Sumaré Caminhões","Sumare","SP"],["Sumaré Máquinas e Veículos","Sumare","SP"],["Super Pesado","Sao Bernardo Do Campo","SP"],["Super Truck","Jundiai","SP"],["Suplantador Transportes","Sao Paulo","SP"],["Taipastur","Jundiai","SP"],["Talarico Caminhões","Sao Paulo","SP"],["Talismã Caminhões","Vargem Grande Do Sul","SP"],["Tebom Caminhões","Campinas","SP"],["Técnica Implementos Rodoviários - NOMA","Presidente Prudente","SP"],["Terra Santa Implementos Agrícolas","Bebedouro","SP"],["Terra Tratores Implementos","Presidente Prudente","SP"],["Terraverde Rental - SP","Casa Branca","SP"],["Teruel Tratores","Alvinlandia","SP"],["THB Comércio Máquinas Agrícolas","Batatais","SP"],["Thor Carretas - NOMA","Sao Jose Do Rio Preto","SP"],["THV Transportes","Guarulhos","SP"],["Tiete Caminhões - Volkwagem","Osasco","SP"],["Tim Carretas","Limeira","SP"],["Titan Carretas","Campinas","SP"],["Toledo Peças e Tratores Usados","Barretos","SP"],["Tomatinho Caminhões - Matriz","Ribeirao Preto","SP"],["Top Caminhões SP","Limeira","SP"],["TOPCOM Carretas e Caminhões","Sorocaba","SP"],["Toso Caminhões","Araraquara","SP"],["Transauto Caminhões","Campinas","SP"],["Transciardi","Sao Bernardo Do Campo","SP"],["Transdeziderio Transportes","Guarulhos","SP"],["Translute Seminovos","Barueri","SP"],["Transportadora 6M","Guarulhos","SP"],["Transportadora Água Viva","Avare","SP"],["Transportadora AP de Rancharia","Rancharia","SP"],["Transportadora Danglares Duarte","Araraquara","SP"],["Transportadora Incerpe","Limeira","SP"],["Transportadora Mademil","Franca","SP"],["Transportadora Marques Roberto","Rancharia","SP"],["Transportadora Noato","Barretos","SP"],["Transportadora Trans Real","Sao Jose Do Rio Preto","SP"],["Transportadora Veronese","Sao Jose Do Rio Preto","SP"],["Transportes Fraore","Paulinia","SP"],["Transporte Wilton Pereira","Ibitinga","SP"],["Transrio - Matriz Adm - AUTOMOB - AGROMOB","Mogi Das Cruzes","SP"],["Transrio VW - Caçapava","Cacapava","SP"],["Trans Shirley","Osasco","SP"],["Tratoeste Máquinas e Implementos Agrícolas","Santa Fe Do Sul","SP"],["Tratorauto","Ourinhos","SP"],["Trevo Caminhões SP","Sertaozinho","SP"],["Trevo Carretas","Sumare","SP"],["Truckvan Indústria e Comércio","Guarulhos","SP"],["Trukão Caminhões","Mogi-Mirim","SP"],["TRW Caminhões","Campinas","SP"],["TVG Caminhões","Guarulhos","SP"],["União Caminhões","Piracicaba","SP"],["União Veículos","Sorocaba","SP"],["Usadão Tratores","Ribeirao Preto","SP"],["Utilitário Veículos","Piracicaba","SP"],["Vamos Seminovos - Caçapava","Cacapava","SP"],["Vamos Seminovos - Campinas","Campinas","SP"],["Vamos Seminovos - Guarulhos","Guarulhos","SP"],["Vamos Seminovos - Itaquera","Sao Paulo","SP"],["Vamos Seminovos - Pinheirinho","Itaquaquecetuba","SP"],["Vamos Seminovos - Regente Feijó","Regente Feijo","SP"],["Vamos Seminovos - Ribeirão Preto - Varejo","Ribeirao Preto","SP"],["Vanlex Caminhões","Sao Bernardo Do Campo","SP"],["Vantroba Transportes","Itu","SP"],["Velit Log Transportes","Taboao Da Serra","SP"],["Vellas Logística","Mirassol","SP"],["Veloce Logística","Diadema","SP"],["Venator Locações","Sao Paulo","SP"],["Venda de Pesados","Sao Jose Dos Campos","SP"],["Venturini Veículos","Piracicaba","SP"],["Via Campos","Cordeiropolis","SP"],["Via Trucks - DAF - Guarulhos-SP","Guarulhos","SP"],["Viga Caminhões","Bebedouro","SP"],["Volcam Diesel","Guarulhos","SP"],["Volks | Confia - Volkswagen","Limeira","SP"],["VTA Transportes","Cordeiropolis","SP"],["WA2 Transportes","Piracicaba","SP"],["WS Máquinas Agrícolas","Sertaozinho","SP"],["WTC Locações","Sao Bernardo Do Campo","SP"],["Zambon Equipamentos Rodoviários - Librelato","Piracicaba","SP"],["Zavatti Veículos","Monte Alto","SP"],["Zé Guerreiro Caminhões","Itatiba","SP"],["ZEROBALA Caminhões","Sorocaba","SP"]];

function fmtBRL(v) {
  if (v === '' || v === null || v === undefined || isNaN(v)) return '—';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
function deltaPct(anunciado, fipe) {
  if (!anunciado || !fipe) return null;
  return ((anunciado - fipe) / fipe) * 100;
}

function Kpi({ label, value, sub }) {
  return (
    <div style={{ background: SURFACE, borderRadius: 12, padding: '1rem 1.1rem', border: `0.5px solid ${BORDER}` }}>
      <div style={{ fontSize: 12, color: INK_MUTED, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 500, color: INK, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: INK_MUTED, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function PriceGauge({ pct }) {
  if (pct === null) return <span style={{ color: INK_MUTED, fontSize: 12 }}>sem FIPE</span>;
  const clamped = Math.max(-40, Math.min(40, pct));
  const posPct = ((clamped + 40) / 80) * 100;
  const color = pct <= -3 ? GREEN : pct >= 8 ? RUST : AMBER;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 130 }}>
      <div style={{ position: 'relative', width: 80, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
        <div style={{ position: 'absolute', left: '50%', top: -2, width: 1, height: 10, background: INK_MUTED }} />
        <div style={{ position: 'absolute', left: `calc(${posPct}% - 3px)`, top: -3, width: 6, height: 12, borderRadius: 3, background: color }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color, fontVariantNumeric: 'tabular-nums', minWidth: 40 }}>
        {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    ativo: { label: 'Ativo', bg: 'rgba(79,174,125,0.15)', fg: GREEN },
    venda_provavel: { label: 'Venda provável', bg: 'rgba(242,169,59,0.15)', fg: AMBER },
    removido: { label: 'Removido', bg: 'rgba(217,113,79,0.15)', fg: RUST },
  };
  const s = map[status] || map.ativo;
  return <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.fg, whiteSpace: 'nowrap' }}>{s.label}</span>;
}

function AnuncioCard({ a }) {
  const delta = deltaPct(a.preco, a.fipe);
  return (
    <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: INK_MUTED, marginBottom: 2 }}>{a.tipo}</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{a.marca} {a.modelo}</div>
          <div style={{ fontSize: 12, color: INK_MUTED }}>{a.ano}{a.km !== '—' ? ` · ${a.km} km` : ''}</div>
        </div>
        <StatusBadge status={a.status} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 19, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmtBRL(a.preco)}</div>
        {delta !== null && <PriceGauge pct={delta} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: INK_MUTED }}>
        <MapPin size={13} aria-hidden="true" /> {a.revenda} · {a.cidade}/{a.uf}
      </div>
      <div style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: INK_MUTED }}>
          <Clock size={12} aria-hidden="true" /> {a.dias}d no anúncio · {a.ultimaVez}
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: STEEL }}>anúncio original <ExternalLink size={11} aria-hidden="true" /></span>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: '1.1rem', marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: subtitle ? 2 : 12 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: INK_MUTED, marginBottom: 12 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

// ---------- Página: Dashboard ----------
function PageDashboard() {
  const [kpis, setKpis] = useState(null);
  const [kpisErro, setKpisErro] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/kpis.php`)
      .then(r => { if (!r.ok) throw new Error('erro'); return r.json(); })
      .then(setKpis)
      .catch(() => setKpisErro(true));
  }, []);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Kpi label="Revendas monitoradas" value={kpis ? kpis.revendas_monitoradas.toLocaleString('pt-BR') : '1.567'} sub={kpis ? 'dados reais' : '20 estados (exemplo)'} />
        <Kpi label="Anúncios ativos" value={kpis ? kpis.anuncios_ativos.toLocaleString('pt-BR') : '—'} sub={kpis ? 'dados reais' : 'aguardando 1º ciclo'} />
        <Kpi label="Vendas estimadas (mês)" value={kpis ? kpis.vendas_estimadas_mes : '—'} sub="anúncios removidos" />
        <Kpi label="Desvio médio vs FIPE" value="—" sub="ver aba Preços (Fase 2)" />
      </div>
      {kpisErro && (
        <div style={{ fontSize: 12, color: INK_MUTED, marginBottom: 16, background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px' }}>
          Não foi possível buscar dados reais da API ({API_BASE_URL}) — mostrando valores de exemplo. Confirme se a API já foi publicada e se o endereço acima está correto.
        </div>
      )}
      <SectionCard title="Ranking nacional por estado" subtitle="Nº de revendas cadastradas no radar">
        <div style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={STATE_DATA.map(([uf, name, qtd]) => ({ name: uf, qtd }))} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: INK_MUTED, fontSize: 11 }} axisLine={{ stroke: BORDER }} tickLine={false} />
              <YAxis tick={{ fill: INK_MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: SURFACE_2, border: `0.5px solid ${BORDER}`, borderRadius: 8, color: INK }} />
              <Bar dataKey="qtd" fill={AMBER} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
      <SectionCard title="Alertas recentes" subtitle="Exemplo do que este painel vai mostrar quando o scraper estiver rodando">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Scania R450 20% abaixo da FIPE em Maringá/PR', AMBER],
            ['3 anúncios novos em Cascavel/PR nas últimas 12h', STEEL],
            ['SVD Seminovos removeu 2 anúncios (venda provável)', GREEN],
          ].map(([txt, color], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: color, flexShrink: 0 }} />
              {txt}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// Mapeia o status salvo no banco (Fase 1) para o rótulo que o card já sabe exibir.
const STATUS_DB_PARA_UI = {
  ativo: 'ativo',
  removido_candidato: 'venda_provavel',
  removido_confirmado: 'removido',
};

function mapeiaAnuncioReal(a) {
  const dias = Math.max(0, Math.round((new Date(a.ultima_vez_ativo) - new Date(a.primeira_vez_visto)) / 86400000));
  return {
    id: a.anuncio_portal_id,
    tipo: a.tipo || '—',
    marca: a.marca || '',
    modelo: a.titulo,
    ano: a.ano_inicial ? `${a.ano_inicial}/${a.ano_final}` : '',
    km: '—',
    preco: a.preco,
    fipe: null, // preço FIPE chega na Fase 2 (mapeamento de marca/modelo)
    revenda: a.revenda,
    cidade: a.cidade,
    uf: a.uf,
    ultimaVez: new Date(a.ultima_vez_ativo).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    status: STATUS_DB_PARA_UI[a.status] || 'ativo',
    dias,
  };
}

// ---------- Página: Anúncios ----------
function PageAnuncios() {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [anuncios, setAnuncios] = useState(SAMPLE_ANUNCIOS);
  const [usandoDadosReais, setUsandoDadosReais] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/anuncios.php?limit=100`)
      .then(r => { if (!r.ok) throw new Error('erro'); return r.json(); })
      .then(data => {
        if (data.anuncios && data.anuncios.length > 0) {
          setAnuncios(data.anuncios.map(mapeiaAnuncioReal));
          setUsandoDadosReais(true);
        }
      })
      .catch(() => { /* mantém os dados de exemplo */ });
  }, []);

  const filtered = anuncios.filter(a => {
    if (statusFilter !== 'todos' && a.status !== statusFilter) return false;
    if (q && !(`${a.marca} ${a.modelo} ${a.cidade}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar marca, modelo ou cidade..." style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="todos">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="venda_provavel">Venda provável</option>
          <option value="removido">Removido</option>
        </select>
      </div>
      <div style={{ fontSize: 12, color: INK_MUTED, marginBottom: 12 }}>
        {filtered.length} anúncio(s) {usandoDadosReais ? '— dados reais da coleta' : 'de exemplo — layout final, dados reais assim que a API estiver publicada'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
        {filtered.map(a => <AnuncioCard key={a.id} a={a} />)}
      </div>
    </div>
  );
}

// ---------- Página: Análise e Insight de Mercado ----------
function PageAnalise() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Oi! Pergunte algo sobre o mercado, por exemplo: "qual marca está mais descontada em PR essa semana?"' }
  ]);
  const [input, setInput] = useState('');
  function send(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(prev => [...prev, { from: 'user', text: input },
      { from: 'bot', text: 'Assim que o scraper e os indicadores estiverem rodando, essa resposta vai vir com dados reais da sua base — por enquanto isso é uma demonstração do layout do chat.' }]);
    setInput('');
  }
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Kpi label="Câmbio USD/BRL" value="—" sub="fonte a integrar" />
        <Kpi label="Selic" value="—" sub="fonte a integrar" />
        <Kpi label="Vendas 0km (ANFAVEA)" value="—" sub="fonte a integrar" />
        <Kpi label="Exportação de pesados" value="—" sub="fonte a integrar" />
      </div>
      <SectionCard title="Insight diário" subtitle="Resumo automático gerado toda manhã (exemplo de formato)">
        <div style={{ fontSize: 13.5, lineHeight: 1.7, color: INK }}>
          Hoje o giro estimado em PR segue estável. Nenhuma variação relevante de câmbio ou Selic no dia.
          Assim que os indicadores externos e o histórico de vendas estimadas estiverem alimentando esta seção,
          o resumo vai citar números reais da sua base.
        </div>
      </SectionCard>
      <SectionCard title="Chat de insight personalizado" subtitle="Pergunte sobre o mercado com base na sua própria base de dados">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', marginBottom: 10, paddingRight: 4 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
              background: m.from === 'user' ? AMBER : SURFACE_2,
              color: m.from === 'user' ? BG : INK,
              borderRadius: 10, padding: '8px 12px', fontSize: 13, maxWidth: '85%'
            }}>{m.text}</div>
          ))}
        </div>
        <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Pergunte ao OPER RADAR..." style={{ ...inputStyle, flex: 1 }} />
          <button type="submit" style={{ background: AMBER, border: 'none', borderRadius: 8, width: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Send size={15} color={BG} aria-hidden="true" />
          </button>
        </form>
      </SectionCard>
    </div>
  );
}

// ---------- Página: Lojistas ----------
function RegionalMap({ onSelect, selected }) {
  const max = Math.max(...STATE_DATA.map(s => s[2]));
  return (
    <div>
      <svg viewBox="0 0 900 820" style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }} role="img" aria-label="Mapa esquemático do Brasil por região, com o tamanho da bolha representando o número de revendas por estado">
        {STATE_DATA.map(([uf, name, qtd]) => {
          const [gx, gy] = STATE_LAYOUT[uf] || [0, 0];
          const x = gx * 100 + 60, y = gy * 90 + 40;
          const r = 10 + (qtd / max) * 32;
          const isSel = selected === uf;
          return (
            <g key={uf} onClick={() => onSelect(uf)} style={{ cursor: 'pointer' }}>
              <circle cx={x} cy={y} r={r} fill={isSel ? AMBER : STEEL} fillOpacity={isSel ? 0.9 : 0.55} stroke={isSel ? AMBER : 'transparent'} strokeWidth={2} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fill={INK} style={{ pointerEvents: 'none' }}>{uf}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ fontSize: 11, color: INK_MUTED, textAlign: 'center', marginTop: 6 }}>
        Mapa esquemático por região (não geograficamente preciso) — tamanho da bolha = nº de revendas. Toque num estado para filtrar.
      </div>
    </div>
  );
}

function PageLojistas() {
  const [uf, setUf] = useState('PR');
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    let rows = DEALERS.filter(d => d[2] === uf);
    if (q) rows = rows.filter(d => d[0].toLowerCase().includes(q.toLowerCase()) || d[1].toLowerCase().includes(q.toLowerCase()));
    return rows.slice(0, 150);
  }, [uf, q]);
  const ufInfo = STATE_DATA.find(s => s[0] === uf);
  return (
    <div>
      <SectionCard title="Distribuição nacional">
        <RegionalMap onSelect={setUf} selected={uf} />
      </SectionCard>
      <SectionCard title={`Lojistas em ${ufInfo ? ufInfo[1] : uf}`} subtitle={ufInfo ? `${ufInfo[2]} revendas cadastradas` : ''}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar revenda ou cidade..." style={{ ...inputStyle, width: '100%', marginBottom: 10 }} />
        {filtered.length === 0 ? (
          <div style={{ fontSize: 13, color: INK_MUTED, textAlign: 'center', padding: '1.5rem 0' }}>
            Detalhamento completo disponível para PR, SC e SP. Os demais estados aparecem só no total do mapa por enquanto.
          </div>
        ) : (
          <div style={{ maxHeight: 320, overflowY: 'auto', border: `0.5px solid ${BORDER}`, borderRadius: 8 }}>
            {filtered.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', borderTop: i ? `0.5px solid ${BORDER}` : 'none', fontSize: 13 }}>
                <span>{d[0]}</span><span style={{ color: INK_MUTED }}>{d[1]}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ---------- Página: Configuração ----------
function PageConfig() {
  const [subtab, setSubtab] = useState('geral');
  const [role, setRole] = useState('Admin');
  const isAdmin = role === 'Admin';
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {['geral', 'usuarios', 'campos'].map(t => (
          <button key={t} onClick={() => setSubtab(t)} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            background: subtab === t ? SURFACE_3 : 'transparent', color: subtab === t ? INK : INK_MUTED, border: `0.5px solid ${subtab === t ? BORDER : 'transparent'}`
          }}>{t === 'geral' ? 'Geral' : t === 'usuarios' ? 'Usuários' : 'Campos personalizados'}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: INK_MUTED }}>Ver como:</span>
          <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
            <option>Admin</option><option>Gestor</option><option>Analista</option><option>Visualizador</option>
          </select>
        </div>
      </div>

      {subtab === 'geral' && (
        <SectionCard title="Configuração geral">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
            <div><div style={labelStyle}>Nome da empresa</div><input defaultValue="Agência Oper" style={inputStyle} disabled={!isAdmin} /></div>
            <div><div style={labelStyle}>Fuso horário</div><input defaultValue="América/São_Paulo (GMT-3)" style={inputStyle} disabled={!isAdmin} /></div>
            <div><div style={labelStyle}>Coleta — manhã</div><input defaultValue="07:00" style={inputStyle} disabled={!isAdmin} /></div>
            <div><div style={labelStyle}>Coleta — noite</div><input defaultValue="19:00" style={inputStyle} disabled={!isAdmin} /></div>
          </div>
          {!isAdmin && <div style={{ fontSize: 12, color: AMBER, marginTop: 10 }}>Papel "{role}" não pode editar a configuração geral — campos bloqueados nesta visualização.</div>}
        </SectionCard>
      )}

      {subtab === 'usuarios' && (
        <SectionCard title="Usuários e permissões">
          {isAdmin ? (
            <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: SURFACE_2 }}>
                  <tr><th style={thStyle}>Nome</th><th style={thStyle}>Papel</th><th style={thStyle}>Status</th></tr>
                </thead>
                <tbody>
                  {SAMPLE_USERS.map((u, i) => (
                    <tr key={i} style={{ borderTop: `0.5px solid ${BORDER}` }}>
                      <td style={tdStyle}>{u.nome}<div style={{ fontSize: 11, color: INK_MUTED }}>{u.email}</div></td>
                      <td style={tdStyle}>{u.papel}</td>
                      <td style={tdStyle}><span style={{ color: u.status === 'ativo' ? GREEN : AMBER, fontSize: 12 }}>{u.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: INK_MUTED }}>
              <ShieldCheck size={15} aria-hidden="true" /> Gerenciar usuários é restrito ao papel Admin.
            </div>
          )}
        </SectionCard>
      )}

      {subtab === 'campos' && (
        <SectionCard title="Campos personalizados" subtitle="Adicione campos extras em Anúncios ou Lojistas">
          <div style={{ border: `0.5px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: SURFACE_2 }}>
                <tr><th style={thStyle}>Campo</th><th style={thStyle}>Tipo</th><th style={thStyle}>Aplica em</th></tr>
              </thead>
              <tbody>
                {CUSTOM_FIELDS.map((f, i) => (
                  <tr key={i} style={{ borderTop: `0.5px solid ${BORDER}` }}>
                    <td style={tdStyle}>{f.nome}</td><td style={tdStyle}>{f.tipo}</td><td style={tdStyle}>{f.aplicaEm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isAdmin && (
            <button style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `0.5px solid ${BORDER}`, color: INK, borderRadius: 8, padding: '7px 12px', fontSize: 13, cursor: 'pointer' }}>
              <Plus size={14} aria-hidden="true" /> Novo campo
            </button>
          )}
        </SectionCard>
      )}
    </div>
  );
}

const inputStyle = { background: SURFACE_2, color: INK, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 13 };
const labelStyle = { fontSize: 11, color: INK_MUTED, marginBottom: 4 };
const thStyle = { textAlign: 'left', padding: '8px 12px', color: INK_MUTED, fontWeight: 500, fontSize: 12 };
const tdStyle = { padding: '9px 12px', verticalAlign: 'top' };

export default function OperRadarApp() {
  const [page, setPage] = useState('dashboard');
  const pages = { dashboard: PageDashboard, anuncios: PageAnuncios, analise: PageAnalise, lojistas: PageLojistas, config: PageConfig };
  const Active = pages[page];
  const activeItem = NAV_ITEMS.find(n => n.id === page);

  return (
    <div style={{ background: BG, color: INK, fontFamily: "'Inter', system-ui, sans-serif", borderRadius: 16, minHeight: 640, display: 'flex', overflow: 'hidden' }}>
      <style>{`
        .fr-sidebar { display: flex; }
        .fr-bottomnav { display: none; }
        @media (max-width: 720px) {
          .fr-sidebar { display: none; }
          .fr-bottomnav { display: flex; }
        }
      `}</style>

      <h2 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        OPER RADAR: aplicativo de inteligência de mercado com painel de indicadores, anúncios em formato de card, análise de mercado com chat de insight, mapa de lojistas e configurações com controle de permissão
      </h2>

      <div className="fr-sidebar" style={{ flexDirection: 'column', width: 200, borderRight: `0.5px solid ${BORDER}`, padding: '1.25rem 0.75rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0.5rem', marginBottom: 24 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: AMBER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={15} color={BG} aria-hidden="true" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 500 }}>OPER RADAR</span>
        </div>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', marginBottom: 2,
            borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit', textAlign: 'left',
            background: page === item.id ? SURFACE_2 : 'transparent', color: page === item.id ? INK : INK_MUTED
          }}>
            <item.icon size={16} aria-hidden="true" /> {item.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '1.25rem 1.25rem 0.5rem', borderBottom: `0.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <activeItem.icon size={17} color={AMBER} aria-hidden="true" />
          <span style={{ fontSize: 16, fontWeight: 500 }}>{activeItem.label}</span>
        </div>
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, paddingBottom: 90 }}>
          <Active />
        </div>
      </div>

      <div className="fr-bottomnav" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, background: SURFACE, borderTop: `0.5px solid ${BORDER}`,
        padding: '8px 4px', justifyContent: 'space-around'
      }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', color: page === item.id ? AMBER : INK_MUTED, fontSize: 10.5, flex: 1
          }}>
            <item.icon size={19} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
