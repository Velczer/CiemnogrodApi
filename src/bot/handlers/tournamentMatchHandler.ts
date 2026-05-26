import { client } from '../client.js';
import { submitTournamentMatchResult } from '../services/submitTournamentMatchResult.js';

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName !== 'tournamentmatch') return;

  await interaction.deferReply();

  try {
    const matchNumber = interaction.options.getInteger('match');
    const score = interaction.options.getString('score');

    if (!matchNumber || !score) {
      await interaction.editReply('Brak danych');
      return;
    }

    const result = await submitTournamentMatchResult(matchNumber, score);

    if (result.tournamentCompleted && result.loser) {
      await interaction.editReply(
        `🏆 Turniej zakończony!\nZwycięzca: ${result.winner.name}\n🥈 Drugie miejsce zajmuje: ${result.loser.name}`
      );

      return;
    }

    if (result.round === 'ThirdPlace') {
      await interaction.editReply(
        `🥉 Walka o trzecie miejsce zakończona!\nTrzecie miejsce zdobywa: ${result.winner.name}`
      );

      return;
    }

    await interaction.editReply(
      `Wynik zapisany.\n${result.winner.name} awansuje do meczu #${result.nextMatchNumber}`
    );
  } catch (err) {
    console.error(err);

    await interaction.editReply(
      err instanceof Error ? err.message : 'Nie udało się zapisać wyniku'
    );
  }
});
