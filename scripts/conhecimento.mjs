// Gera lib/ai/conhecimento.ts a partir de docs/veipar-conhecimento.md (seções 1 a 6; a 7 é só para o dono).
import { readFileSync, writeFileSync } from 'node:fs';

const RULES = `Regras de uso deste conhecimento:
- Itens marcados "(confirmar)" NÃO estão confirmados pela Veipar: não afirme nada sobre eles ao cliente; diga que o vendedor confirma.
- Preços são os da loja online na data indicada: cite só como referência do site; valor final, frete, prazo e pagamento quem confirma é o vendedor.
- Não passe ao cliente o link da loja FCLICKCOMEREP do Mercado Livre.`;

const md = readFileSync('docs/veipar-conhecimento.md', 'utf8');
const body = md.split('\n## 7. Lacunas')[0].split('\n---\n').slice(1).join('\n---\n').trim();
const esc = (s) => s.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');

writeFileSync('lib/ai/conhecimento.ts', `/**
 * Base de conhecimento da atendente — seções 1 a 6 de docs/veipar-conhecimento.md.
 * Não edite aqui: altere o .md (ou as regras em scripts/conhecimento.mjs) e rode \`npm run conhecimento\`.
 */
export const CONHECIMENTO = \`${esc(RULES)}

${esc(body)}\`;
`);
console.log('lib/ai/conhecimento.ts atualizado');
