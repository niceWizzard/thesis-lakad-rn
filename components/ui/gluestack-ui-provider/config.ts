'use client';
import { vars } from 'nativewind';


export const lightVars = {
  /* Primary - Emerald Green (Kept as requested) */
  '--color-primary-0': '236 253 245',
  '--color-primary-50': '236 253 245',
  '--color-primary-100': '209 250 229',
  '--color-primary-200': '167 243 208',
  '--color-primary-300': '110 231 183',
  '--color-primary-400': '52 211 153',
  '--color-primary-500': '16 185 129',
  '--color-primary-600': '5 150 105',
  '--color-primary-700': '4 120 87',
  '--color-primary-800': '6 95 70',
  '--color-primary-900': '6 78 59',
  '--color-primary-950': '2 44 34',

  /* Secondary - Light Gray */
  '--color-secondary-0': '255 255 255',
  '--color-secondary-50': '252 252 252',
  '--color-secondary-100': '250 250 250',
  '--color-secondary-200': '248 248 248',
  '--color-secondary-300': '244 244 244',
  '--color-secondary-400': '232 232 232',
  '--color-secondary-500': '224 224 224',
  '--color-secondary-600': '200 200 200',
  '--color-secondary-700': '160 160 160',
  '--color-secondary-800': '120 120 120',
  '--color-secondary-900': '80 80 80',
  '--color-secondary-950': '40 40 40',

  /* Tertiary - Indigo */
  '--color-tertiary-0': '238 242 255',
  '--color-tertiary-50': '224 231 255',
  '--color-tertiary-100': '199 210 254',
  '--color-tertiary-200': '165 180 252',
  '--color-tertiary-300': '129 140 248',
  '--color-tertiary-400': '99 102 241',
  '--color-tertiary-500': '79 70 229',
  '--color-tertiary-600': '67 56 202',
  '--color-tertiary-700': '55 48 163',
  '--color-tertiary-800': '49 46 129',
  '--color-tertiary-900': '30 27 75',
  '--color-tertiary-950': '15 12 41',

  /* Error - Red */
  '--color-error-0': '254 242 242',
  '--color-error-50': '254 242 242',
  '--color-error-100': '254 226 226',
  '--color-error-200': '254 202 202',
  '--color-error-300': '252 165 165',
  '--color-error-400': '248 113 113',
  '--color-error-500': '239 68 68',
  '--color-error-600': '220 38 38',
  '--color-error-700': '185 28 28',
  '--color-error-800': '153 27 27',
  '--color-error-900': '127 29 29',
  '--color-error-950': '69 10 10',

  /* Success - Green */
  '--color-success-0': '240 253 244',
  '--color-success-50': '240 253 244',
  '--color-success-100': '220 252 231',
  '--color-success-200': '187 247 208',
  '--color-success-300': '134 239 172',
  '--color-success-400': '74 222 128',
  '--color-success-500': '34 197 94',
  '--color-success-600': '22 163 74',
  '--color-success-700': '21 128 61',
  '--color-success-800': '22 101 52',
  '--color-success-900': '20 83 45',
  '--color-success-950': '5 46 22',

  /* Warning - Amber */
  '--color-warning-0': '255 251 235',
  '--color-warning-50': '255 251 235',
  '--color-warning-100': '254 243 199',
  '--color-warning-200': '253 230 138',
  '--color-warning-300': '252 211 77',
  '--color-warning-400': '251 191 36',
  '--color-warning-500': '245 158 11',
  '--color-warning-600': '217 119 6',
  '--color-warning-700': '180 83 9',
  '--color-warning-800': '146 64 14',
  '--color-warning-900': '120 53 15',
  '--color-warning-950': '69 26 3',

  /* Info - Sky */
  '--color-info-0': '240 249 255',
  '--color-info-50': '240 249 255',
  '--color-info-100': '224 242 254',
  '--color-info-200': '186 230 253',
  '--color-info-300': '125 211 252',
  '--color-info-400': '56 189 248',
  '--color-info-500': '14 165 233',
  '--color-info-600': '2 132 199',
  '--color-info-700': '3 105 161',
  '--color-info-800': '7 89 133',
  '--color-info-900': '12 74 110',
  '--color-info-950': '8 47 73',

  /* Typography - Maximum Contrast */
  '--color-typography-0': '255 255 255',
  '--color-typography-50': '245 245 245',
  '--color-typography-100': '230 230 230',
  '--color-typography-200': '215 215 215',
  '--color-typography-300': '180 180 180',
  '--color-typography-400': '138 138 138',
  '--color-typography-500': '95 95 95',
  '--color-typography-600': '70 70 70',
  '--color-typography-700': '55 55 55',
  '--color-typography-800': '40 40 40',
  '--color-typography-900': '20 20 20',
  '--color-typography-950': '0 0 0',

  /* Outline - Balanced Borders */
  '--color-outline-0': '226 226 226', // Softer border than before
  '--color-outline-50': '218 218 218',
  '--color-outline-100': '210 210 210',
  '--color-outline-200': '190 190 190',
  '--color-outline-300': '170 170 170',
  '--color-outline-400': '140 140 140',
  '--color-outline-500': '95 95 95',
  '--color-outline-600': '70 70 70',
  '--color-outline-700': '55 55 55',
  '--color-outline-800': '40 40 40',
  '--color-outline-900': '20 20 20',
  '--color-outline-950': '0 0 0',

  /* Background - Balanced Contrast */
  '--color-background-0': '255 255 255',
  '--color-background-50': '243 243 243', // Balanced Gray
  '--color-background-100': '230 230 230', // Balanced Step
  '--color-background-200': '215 215 215',
  '--color-background-300': '180 180 180',
  '--color-background-400': '138 138 138',
  '--color-background-500': '95 95 95',
  '--color-background-600': '70 70 70',
  '--color-background-700': '55 55 55',
  '--color-background-800': '40 40 40',
  '--color-background-900': '20 20 20',
  '--color-background-950': '0 0 0',

  /* Background Special */
  '--color-background-error': '254 242 242',
  '--color-background-warning': '255 251 235',
  '--color-background-success': '240 253 244',
  '--color-background-muted': '230 230 230', // Matches darker background-100
  '--color-background-info': '240 249 255',

  /* Focus Ring Indicator */
  '--color-indicator-primary': '16 185 129',
  '--color-indicator-info': '14 165 233',
  '--color-indicator-error': '239 68 68',
} as const


export const darkVars = {
  /* Primary - High Contrast Emerald for Dark Mode */
  '--color-primary-0': '2 44 34',
  '--color-primary-50': '6 78 59',
  '--color-primary-100': '6 95 70',
  '--color-primary-200': '4 120 87',
  '--color-primary-300': '5 150 105',
  '--color-primary-400': '16 185 129',
  '--color-primary-500': '52 211 153', // Brighter for readability on black
  '--color-primary-600': '110 231 183',
  '--color-primary-700': '167 243 208',
  '--color-primary-800': '209 250 229',
  '--color-primary-900': '236 253 245',
  '--color-primary-950': '255 255 255',

  /* Secondary */
  '--color-secondary-0': '20 20 20',
  '--color-secondary-50': '23 23 23',
  '--color-secondary-100': '31 31 31',
  '--color-secondary-200': '39 39 39',
  '--color-secondary-300': '44 44 44',
  '--color-secondary-400': '56 57 57',
  '--color-secondary-500': '63 64 64',
  '--color-secondary-600': '86 86 86',
  '--color-secondary-700': '110 110 110',
  '--color-secondary-800': '135 135 135',
  '--color-secondary-900': '150 150 150',
  '--color-secondary-950': '164 164 164',

  /* Tertiary */
  '--color-tertiary-0': '15 12 41',
  '--color-tertiary-50': '30 27 75',
  '--color-tertiary-100': '49 46 129',
  '--color-tertiary-200': '55 48 163',
  '--color-tertiary-300': '67 56 202',
  '--color-tertiary-400': '79 70 229',
  '--color-tertiary-500': '99 102 241',
  '--color-tertiary-600': '129 140 248',
  '--color-tertiary-700': '165 180 252',
  '--color-tertiary-800': '199 210 254',
  '--color-tertiary-900': '224 231 255',
  '--color-tertiary-950': '238 242 255',

  /* Error */
  '--color-error-0': '83 19 19',
  '--color-error-50': '127 29 29',
  '--color-error-100': '153 27 27',
  '--color-error-200': '185 28 28',
  '--color-error-300': '220 38 38',
  '--color-error-400': '230 53 53',
  '--color-error-500': '239 68 68',
  '--color-error-600': '249 97 96',
  '--color-error-700': '229 91 90',
  '--color-error-800': '254 202 202',
  '--color-error-900': '254 226 226',
  '--color-error-950': '254 233 233',

  /* Success */
  '--color-success-0': '5 46 22',
  '--color-success-50': '20 71 45',
  '--color-success-100': '20 83 45',
  '--color-success-200': '21 101 52',
  '--color-success-300': '21 128 61',
  '--color-success-400': '22 163 74',
  '--color-success-500': '34 197 94',
  '--color-success-600': '74 222 128',
  '--color-success-700': '134 239 172',
  '--color-success-800': '187 247 208',
  '--color-success-900': '220 252 231',
  '--color-success-950': '240 253 244',

  /* Warning */
  '--color-warning-0': '84 45 18',
  '--color-warning-50': '108 56 19',
  '--color-warning-100': '130 68 23',
  '--color-warning-200': '180 90 26',
  '--color-warning-300': '215 108 31',
  '--color-warning-400': '231 120 40',
  '--color-warning-500': '251 149 75',
  '--color-warning-600': '253 173 116',
  '--color-warning-700': '254 205 170',
  '--color-warning-800': '255 231 213',
  '--color-warning-900': '255 244 237',
  '--color-warning-950': '255 249 245',

  /* Info */
  '--color-info-0': '3 38 56',
  '--color-info-50': '5 64 93',
  '--color-info-100': '7 90 131',
  '--color-info-200': '9 115 168',
  '--color-info-300': '11 141 205',
  '--color-info-400': '13 166 242',
  '--color-info-500': '50 180 244',
  '--color-info-600': '87 194 246',
  '--color-info-700': '124 207 248',
  '--color-info-800': '162 221 250',
  '--color-info-900': '199 235 252',
  '--color-info-950': '236 248 254',

  /* Typography */
  '--color-typography-0': '23 23 23',
  '--color-typography-50': '38 38 39',
  '--color-typography-100': '64 64 64',
  '--color-typography-200': '82 82 82',
  '--color-typography-300': '115 115 115',
  '--color-typography-400': '140 140 140',
  '--color-typography-500': '163 163 163',
  '--color-typography-600': '212 212 212',
  '--color-typography-700': '219 219 220',
  '--color-typography-800': '229 229 229',
  '--color-typography-900': '245 245 245',
  '--color-typography-950': '254 254 255',

  /* Outline */
  '--color-outline-0': '26 23 23',
  '--color-outline-50': '39 38 36',
  '--color-outline-100': '65 65 65',
  '--color-outline-200': '83 82 82',
  '--color-outline-300': '115 116 116',
  '--color-outline-400': '140 141 141',
  '--color-outline-500': '165 163 163',
  '--color-outline-600': '211 211 211',
  '--color-outline-700': '221 220 219',
  '--color-outline-800': '230 230 230',
  '--color-outline-900': '243 243 243',
  '--color-outline-950': '253 254 254',

  /* Background */
  '--color-background-0': '18 18 18',
  '--color-background-50': '39 38 37',
  '--color-background-100': '65 64 64',
  '--color-background-200': '83 82 82',
  '--color-background-300': '116 116 116',
  '--color-background-400': '142 142 142',
  '--color-background-500': '162 163 163',
  '--color-background-600': '213 212 212',
  '--color-background-700': '229 228 228',
  '--color-background-800': '242 241 241',
  '--color-background-900': '246 246 246',
  '--color-background-950': '255 255 255',

  /* Background Special */
  '--color-background-error': '66 43 43',
  '--color-background-warning': '65 47 35',
  '--color-background-success': '28 43 33',
  '--color-background-muted': '51 51 51',
  '--color-background-info': '26 40 46',

  /* Focus Ring Indicator */
  '--color-indicator-primary': '16 185 129',
  '--color-indicator-info': '161 199 245',
  '--color-indicator-error': '232 70 69',
} as const;

export const config = {
  light: vars(lightVars),

  dark: vars(darkVars),
};