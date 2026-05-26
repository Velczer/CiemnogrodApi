import { SlashCommandBuilder } from 'discord.js';

export const tournamentMatchCommand = new SlashCommandBuilder()
  .setName('tournamentmatch')
  .setDescription('Dodaje wynik meczu turniejowego')
  .addIntegerOption((opt) =>
    opt.setName('match').setDescription('Numer meczu').setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName('score').setDescription('Wynik np 2:1').setRequired(true)
  );
