// formato.js — formatação de dinheiro e datas (pt-BR).
// Datas são sempre guardadas como texto 'AAAA-MM-DD' para evitar problemas de fuso horário.
// Valores são sempre guardados em CENTAVOS (número inteiro): R$ 12,34 = 1234.

const Formato = (() => {
  const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const numero = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
    'quinta-feira', 'sexta-feira', 'sábado'];

  const maiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  // 123456 -> "R$ 1.234,56"
  function dinheiro(centavos) {
    return moeda.format((centavos || 0) / 100);
  }

  // 123456 -> "1.234,56" (sem o "R$", usado no campo de valor)
  function numeroValor(centavos) {
    return numero.format((centavos || 0) / 100);
  }

  // "1.234,56" -> 123456. Lê só os dígitos: o campo funciona como em app de banco.
  function lerValor(texto) {
    const digitos = String(texto || '').replace(/\D/g, '').slice(0, 11);
    return digitos ? parseInt(digitos, 10) : 0;
  }

  function iso(ano, mes, dia) {
    return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  // "2026-11-09" -> "09/11/2026"
  function data(textoIso) {
    if (!textoIso) return '';
    const [a, m, d] = textoIso.split('-');
    return `${d}/${m}/${a}`;
  }

  function partes(textoIso) {
    const [ano, mes, dia] = textoIso.split('-').map(Number);
    return { ano, mes, dia };
  }

  function hoje() {
    const h = new Date();
    return iso(h.getFullYear(), h.getMonth() + 1, h.getDate());
  }

  function diasNoMes(ano, mes) {
    return new Date(ano, mes, 0).getDate();
  }

  // Soma (ou subtrai) meses: somarMeses(2026, 12, 1) -> { ano: 2027, mes: 1 }
  function somarMeses(ano, mes, n) {
    const total = ano * 12 + (mes - 1) + n;
    return { ano: Math.floor(total / 12), mes: (total % 12) + 1 };
  }

  // Data na mesma "posição" N meses depois; o dia 31 vira 30, 28 ou 29 quando preciso.
  function dataMaisMeses(textoIso, n, diaPreferido) {
    const p = partes(textoIso);
    const alvo = somarMeses(p.ano, p.mes, n);
    const dia = Math.min(diaPreferido || p.dia, diasNoMes(alvo.ano, alvo.mes));
    return iso(alvo.ano, alvo.mes, dia);
  }

  function ultimoDiaDoMes(ano, mes) {
    return iso(ano, mes, diasNoMes(ano, mes));
  }

  // (2026, 11) -> "Novembro de 2026"
  function nomeMes(ano, mes) {
    return `${maiuscula(MESES[mes - 1])} de ${ano}`;
  }

  // "2026-11-09" -> "Segunda-feira"
  function diaSemana(textoIso) {
    const p = partes(textoIso);
    return maiuscula(DIAS_SEMANA[new Date(p.ano, p.mes - 1, p.dia).getDay()]);
  }

  return {
    dinheiro, numeroValor, lerValor, iso, data, partes, hoje, diasNoMes,
    somarMeses, dataMaisMeses, ultimoDiaDoMes, nomeMes, diaSemana,
  };
})();
