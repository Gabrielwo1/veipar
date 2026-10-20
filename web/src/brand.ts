/** Identidade do cliente. Troque aqui (e as cores em index.css) para replicar o painel para outra marca. */
export const brand = {
  name: 'Veipar',
  /** Letras do monograma usado enquanto não há logo em web/public/logo-*.png. */
  monogram: 'V',
  /** Saudação do botão "Chamar" no WhatsApp. */
  /** Card "Nosso lucro": percentual sobre o faturamento do período (0.01 = 1%). */
  profit: { label: 'Nosso lucro', rate: 0.01 },
  greeting: (firstName: string) => `Olá${firstName ? ', ' + firstName : ''}! Aqui é da Veipar.`,
};
