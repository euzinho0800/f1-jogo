# F1 06 Web — protótipo 3D

Protótipo jogável de corrida em navegador, com pista 3D procedural, carro construído com geometria própria, adversários, HUD e controles touch. Não é um port oficial nem contém assets extraídos do jogo original.

## Arquivos
- `index.html`: interface e estrutura.
- `style.css`: HUD, menus e controles adaptáveis.
- `main.js`: cena Three.js, pista, carros, IA simples, física arcade e corrida.

## Como testar no Android
O projeto usa módulos JavaScript e Three.js via CDN, então **não funciona de forma confiável abrindo `index.html` diretamente como arquivo local**. Sirva a pasta por HTTP/HTTPS:
1. Coloque os três arquivos numa pasta.
2. Publique num serviço de hospedagem estática HTTPS (por exemplo, GitHub Pages) ou execute um servidor local no computador.
3. Abra o endereço HTTPS no Chrome do Android. É necessário internet para carregar o Three.js da CDN na primeira abertura.
4. Toque em **Iniciar corrida**. Use ◀/▶ para virar, **ACELERAR** para acelerar e **FREIO** para desacelerar. Toque em Ⅱ para pausar.

## Controles
- Android: botões na tela.
- Teclado: setas ou WASD; espaço também acelera; Esc pausa/retoma.

## Limitações conhecidas desta primeira versão
- Física arcade, não simulação fiel.
- IA simples; sem colisões entre carros ainda.
- Pista fictícia, não recriação exata de um circuito oficial.
- Campeonato, garagem, qualificação, pit stops, danos avançados, áudio e salvamento ainda não implementados.
- A contagem de voltas é uma lógica inicial de demonstração e precisa de refinamento para uso competitivo.

## Próximas etapas sugeridas
1. Corrigir a detecção de volta usando cruzamento da linha de chegada e direção.
2. Melhorar direção/derrapagem, colisões e recuperação após sair da pista.
3. Criar menu de garagem, seleção de carro e fim de corrida com reinício.
4. Acrescentar mapa de pista, áudio, pit stops, classificação e campeonato.
5. Otimizar geometria, sombras e densidade para Android de entrada.
