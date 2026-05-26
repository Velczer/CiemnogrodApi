import { SlashCommandBuilder } from 'discord.js';

export const startTournamentCommand = new SlashCommandBuilder()
  .setName('starttournament')
  .setDescription('Tworzy nowy turniej i losuje drabinkę')
  .addUserOption((opt) =>
    opt.setName('player1').setDescription('Gracz 1').setRequired(true)
  )
  .addUserOption((opt) =>
    opt.setName('player2').setDescription('Gracz 2').setRequired(true)
  )
  .addUserOption((opt) =>
    opt.setName('player3').setDescription('Gracz 3').setRequired(false)
  )
  .addUserOption((opt) =>
    opt.setName('player4').setDescription('Gracz 4').setRequired(false)
  )
  .addUserOption((opt) =>
    opt.setName('player5').setDescription('Gracz 5').setRequired(false)
  )
  .addUserOption((opt) =>
    opt.setName('player6').setDescription('Gracz 6').setRequired(false)
  )
  .addUserOption((opt) =>
    opt.setName('player7').setDescription('Gracz 7').setRequired(false)
  )
  .addUserOption((opt) =>
    opt.setName('player8').setDescription('Gracz 8').setRequired(false)
  );
