import { client } from '../client';
import { acceptMatch, tryFinalizeMatch } from '../services/matchService';

/**
 * BUTTON INTERACTIONS (Accept / Reject future-proof)
 */
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, matchId, userId] = interaction.customId.split('_');

  if (!matchId || !userId) return;

  const match = acceptMatch(matchId, userId);

  if (!match) {
    await interaction.reply({
      content: 'Ten mecz już nie istnieje lub wygasł.',
      ephemeral: true,
    });
    return;
  }

  if (action === 'accept') {
    await interaction.reply({
      content: 'Akceptacja zapisana ✔',
      ephemeral: true,
    });

    await tryFinalizeMatch(matchId);
    return;
  }

  if (action === 'reject') {
    // na przyszłość (dispute system)
    await interaction.reply({
      content: 'Odrzucono wynik ❌',
      ephemeral: true,
    });

    return;
  }
});
