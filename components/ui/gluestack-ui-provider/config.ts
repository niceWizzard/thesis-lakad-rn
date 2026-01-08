'use client';
import { vars } from 'nativewind';




{










}
export const config = {
  light: vars({
    /* Primary - Emerald Green */
    '--color-primary-0': '236 253 245',
    '--color-primary-50': '236 253 245',
    '--color-primary-100': '209 250 229',
    '--color-primary-200': '167 243 208',
    '--color-primary-300': '110 231 183',
    '--color-primary-400': '52 211 153',
    '--color-primary-500': '16 185 129', // Standard Emerald 500
    '--color-primary-600': '5 150 105',
    '--color-primary-700': '4 120 87',
    '--color-primary-800': '6 95 70',
    '--color-primary-900': '6 78 59',
    '--color-primary-950': '2 44 34',

    /* Secondary - Neutral Grays */
    '--color-secondary-0': '253 253 253',
    '--color-secondary-50': '251 251 251',
    '--color-secondary-100': '246 246 246',
    '--color-secondary-200': '242 242 242',
    '--color-secondary-300': '237 237 237',
    '--color-secondary-400': '230 230 231',
    '--color-secondary-500': '217 217 219',
    '--color-secondary-600': '198 199 199',
    '--color-secondary-700': '189 189 189',
    '--color-secondary-800': '177 177 177',
    '--color-secondary-900': '165 164 164',
    '--color-secondary-950': '157 157 157',

    /* Tertiary - Indigo/Blue (Complements Green) */
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
    '--color-error-0': '254 233 233',
    '--color-error-50': '254 226 226',
    '--color-error-100': '254 202 202',
    '--color-error-200': '252 165 165',
    '--color-error-300': '248 113 113',
    '--color-error-400': '239 68 68',
    '--color-error-500': '230 53 53',
    '--color-error-600': '220 38 38',
    '--color-error-700': '185 28 28',
    '--color-error-800': '153 27 27',
    '--color-error-900': '127 29 29',
    '--color-error-950': '83 19 19',

    /* Success - Forest Green (Distinct from Primary) */
    '--color-success-0': '240 253 244',
    '--color-success-50': '220 252 231',
    '--color-success-100': '187 247 208',
    '--color-success-200': '134 239 172',
    '--color-success-300': '74 222 128',
    '--color-success-400': '34 197 94',
    '--color-success-500': '22 163 74',
    '--color-success-600': '21 128 61',
    '--color-success-700': '21 101 52',
    '--color-success-800': '20 83 45',
    '--color-success-900': '20 71 45',
    '--color-success-950': '5 46 22',

    /* Warning - Amber */
    '--color-warning-0': '255 249 245',
    '--color-warning-50': '255 244 236',
    '--color-warning-100': '255 231 213',
    '--color-warning-200': '254 205 170',
    '--color-warning-300': '253 173 116',
    '--color-warning-400': '251 149 75',
    '--color-warning-500': '231 120 40',
    '--color-warning-600': '215 108 31',
    '--color-warning-700': '180 90 26',
    '--color-warning-800': '130 68 23',
    '--color-warning-900': '108 56 19',
    '--color-warning-950': '84 45 18',

    /* Info - Sky Blue */
    '--color-info-0': '236 248 254',
    '--color-info-50': '199 235 252',
    '--color-info-100': '162 221 250',
    '--color-info-200': '124 207 248',
    '--color-info-300': '87 194 246',
    '--color-info-400': '50 180 244',
    '--color-info-500': '13 166 242',
    '--color-info-600': '11 141 205',
    '--color-info-700': '9 115 168',
    '--color-info-800': '7 90 131',
    '--color-info-900': '5 64 93',
    '--color-info-950': '3 38 56',

    /* Typography */
    '--color-typography-0': '254 254 255',
    '--color-typography-50': '245 245 245',
    '--color-typography-100': '229 229 229',
    '--color-typography-200': '219 219 220',
    '--color-typography-300': '212 212 212',
    '--color-typography-400': '163 163 163',
    '--color-typography-500': '140 140 140',
    '--color-typography-600': '115 115 115',
    '--color-typography-700': '82 82 82',
    '--color-typography-800': '64 64 64',
    '--color-typography-900': '38 38 39',
    '--color-typography-950': '23 23 23',

    /* Outline */
    '--color-outline-0': '253 254 254',
    '--color-outline-50': '243 243 243',
    '--color-outline-100': '230 230 230',
    '--color-outline-200': '221 220 219',
    '--color-outline-300': '211 211 211',
    '--color-outline-400': '165 163 163',
    '--color-outline-500': '140 141 141',
    '--color-outline-600': '115 116 116',
    '--color-outline-700': '83 82 82',
    '--color-outline-800': '65 65 65',
    '--color-outline-900': '39 38 36',
    '--color-outline-950': '26 23 23',

    /* Background */
    '--color-background-0': '255 255 255',
    '--color-background-50': '246 246 246',
    '--color-background-100': '242 241 241',
    '--color-background-200': '220 219 219',
    '--color-background-300': '213 212 212',
    '--color-background-400': '162 163 163',
    '--color-background-500': '142 142 142',
    '--color-background-600': '116 116 116',
    '--color-background-700': '83 82 82',
    '--color-background-800': '65 64 64',
    '--color-background-900': '39 38 37',
    '--color-background-950': '18 18 18',

    /* Background Special */
    '--color-background-error': '254 241 241',
    '--color-background-warning': '255 243 234',
    '--color-background-success': '237 252 242',
    '--color-background-muted': '247 248 247',
    '--color-background-info': '235 248 254',

    /* Focus Ring Indicator */
    '--color-indicator-primary': '5 150 105',
    '--color-indicator-info': '83 153 236',
    '--color-indicator-error': '185 28 28',
  }),

  dark: vars({
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
  }),
};