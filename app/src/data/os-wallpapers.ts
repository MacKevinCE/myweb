/**
 * Centralized wallpaper resource definitions.
 * Single source of truth for all available wallpapers (images & videos).
 * All videos are muted (no audio tracks).
 */

export type WallpaperCategory = 'image' | 'animation';

export interface WallpaperResource {
  src: string;
  name: string;
  category: WallpaperCategory;
}

function wp(src: string, name: string, category: WallpaperCategory): WallpaperResource {
  return { src, name, category };
}

export const wallpapers: WallpaperResource[] = [
  // Images
  wp('https://assets.mackevince.com/public/images/purpleBlueWaves.webp',            'Purple blue waves',             'image'),
  wp('https://assets.mackevince.com/public/images/texturedDarkBlue.webp',           'Textured dark blue',            'image'),
  wp('https://assets.mackevince.com/public/images/rainbowFluidWavesParticles.webp', 'Rainbow fluid waves particles', 'image'),
  // Animations (muted videos)
  wp('https://assets.mackevince.com/public/video/frozenCoffeeWinter.mp4',           'Frozen coffee winter',          'animation'),
  wp('https://assets.mackevince.com/public/video/windowTheLastOfUs.mp4',            'Window the last of us',         'animation'),
  wp('https://assets.mackevince.com/public/video/underwater.mp4',                   'Underwater',                    'animation'),
  wp('https://assets.mackevince.com/public/video/homeOffice.mp4',                   'Home office',                   'animation'),
  wp('https://assets.mackevince.com/public/video/rainyDay.mp4',                     'Rainy day',                     'animation'),
  wp('https://assets.mackevince.com/public/video/houseInTheJungle.mp4',             'House in the jungle',           'animation'),
  wp('https://assets.mackevince.com/public/video/chillBeach.mp4',                   'Chill beach',                   'animation'),
  wp('https://assets.mackevince.com/public/video/beachHouse.mp4',                   'Beach house',                   'animation'),
  wp('https://assets.mackevince.com/public/video/winter.mp4',                       'Winter',                        'animation'),
  wp('https://assets.mackevince.com/public/video/bigWhale.mp4',                     'Big whale',                     'animation'),
  wp('https://assets.mackevince.com/public/video/malik.mp4',                        'Malik',                         'animation'),
  wp('https://assets.mackevince.com/public/video/Anime.mp4',                        'Anime',                         'animation'),
  wp('https://assets.mackevince.com/public/video/japanStore.mp4',                   'Japan store',                   'animation'),
  wp('https://assets.mackevince.com/public/video/cyberpunkRain.mp4',                'Cyberpunk rain',                'animation'),
  wp('https://assets.mackevince.com/public/video/rainFallingOnWindow.mp4',          'Rain falling on window',        'animation'),
];

export const imageWallpapers    = wallpapers.filter((w) => w.category === 'image');
export const animationWallpapers = wallpapers.filter((w) => w.category === 'animation');

/** Default wallpaper */
export const defaultWallpaper = wallpapers[1];
