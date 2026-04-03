# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## [1.4.0](https://github.com/niceWizzard/thesis-lakad-rn/compare/1.3.1...1.4.0)

### Added
- Added visualization feature for itinerary viewing
- Added confirmation dialog when removing a stop
- Added a dedicated info button for showing the stop as a card

### Changed
- Changed the stop menu from popover to an accordion
- Changed behavior of pressing the itinerary stop item to open the stop item accordion
- Replaced emoji with ChevronsDown in the 'saved distance' in reorder screen
- Improved the ui/ux of itinerary viewing mode bottom sheet (added stats, connecting lines for stops, clearly separated completed and pending stops)
- Changed the loading indicator to use the app's primary color
- Changed `Marked as Arrived` button border radius to fit the app
- Moved the next up stop ui after the steps in navigating mode

### Fixed
- Reduced laggy/jittery ui of the itinerary screen
- Fixed itinerary card still visible after swiping
- Fixed icon not visible on main instruction on navigating mode
- Fixed target text overflowing outside the container on navigating mode
- Fixed bottom sheet slow transitionwhen  switching from navigating mode to viewing mode


## [1.3.1](https://github.com/niceWizzard/thesis-lakad-rn/compare/1.3.0...1.3.1)

### Added
- Added support for > 25 navigation waypoints

### Fixed
- Fixed an issue where the optimized route modal overflows outside the screen for larger itineraries

### Changed
- Changed the border radius of itinerary stop menu item to fit the rounded style of the app
- Used gluestack switch instead of react native switch in navigating mode bottom sheet
- Changed some words on navigating mode to make it less confusing
- Made reorder screen header text less confusing

## [1.3.0](https://github.com/niceWizzard/thesis-lakad-rn/compare/1.2.1...1.3.0)

### Fixed
- Fixed bug where optimize button doesn't optimize the itinerary
- Fixed coordinates text input too crowded due to 
- Fixed bug where admin cannot update places without an error occuring regarding ALL_LANDMARKS
- Fixed discard and delete dialogs not rounded enough
- Fixed an issue where admins see an error when creating places regarding "No landmarks found"

### Added
- Added fullscreen mode in location selection dialog
- Added a dialog that displays the changed distance and sequence after optimizing the itinerary
- Added duplicate checker for adding places
- Added animation to app loading splashscreen

### Changed
- Changed edit duration modal to use a more ui coherent timer picker
- Changed the coordinate button to use a rounded button style


## [1.2.1](https://github.com/niceWizzard/thesis-lakad-rn/compare/1.2.0...1.2.1)

### Added
- Added password visibility toggle to signin, signup, change password screens
- Added search by type of place in explore screen

### Changed
- Removed "Lakad" heading in the More 
- Changed header title of all places screens to "Places" instead of "Landmark"
- Changed colors of filter buttons in filter modal

### Fixed
- Fixed an issue where updating display name toast notification shows incorrect title
- Fixed button sizes not round in place/view
- Fixed color violet appearing in filter buttons
- Fixed color violet on user profile on settings screen
- Fixed version number on admin more screen to show actual version number
- Fixed an issue where header title was defaulted to route on admin/users/[id]/edit
- Fixed pasalubong centers not searchable

## [1.2.0](https://github.com/niceWizzard/thesis-lakad-rn/compare/1.1.0...1.2.0)

### Added 
- Added unverified types to support 'accomodation' in unverified places like Pasalubong Centers

### Changed
- Converted the itinerary settings screen (rename, delete) to a modal for quicker access ([EnigmaG](https://github.com/Brian-Gab)). ([#56](https://github.com/niceWizzard/thesis-lakad-rn/pull/56))
- Disable version checking on dev mode ([EnigmaG](https://github.com/Brian-Gab)). ([#56](https://github.com/niceWizzard/thesis-lakad-rn/pull/56))
- Moved toast notification to top
- Auto switch to admin mode if admin on production
- Updated supabase places types according to phacto specification 
- Updated admin places tab names to "Places" and "Unverified"
- Updated AGAM to use average rating if review_count > 0 otherwise fallback to gmaps_rating
- Updated stopover card aspect ratio to make it taller and skinnier
- Updated edit duration modal to use a more standard timer picker
- Updated search results box to have loading and empty states

### Fixed
- Fixed upload button text stays as replace photo even after uploading a new photo 
- An error showing when creating a place preventing default back behavior.
- Fixed place data cache not updating after deleting/restoring a place
- Fixed stars on review screen overflowing outside the container
- Fixed error on create place when fetching all landmarks for distance matrix update
- Fixed search results box showing landmark type instead of unverified type for unverified landmarks
- Fixed "Back to Regular Mode" switches to admin mode on release


## [1.1.0](https://github.com/niceWizzard/thesis-lakad-rn/compare/1.0...1.1.0)

### Fixed
- Fixed an issue where the text on the "Add to Itinerary" button was being cut off.
- Fixed an issue where See all reviews button was not showing the arrow icon.
- Fixed an issue where the admin analytics was not updating after updating a landmark.
- Fixed an issue where pasalubong centers are not searchable after visiting AGAM screen.
- Fixed an issue where completed stops content disappear on reorder screen
- Fixed bug of report review dialog button text clipping

### Changed
- Improved the layout of the Itinerary Bottom Sheet by adding proper icons, labels, and increasing text sizes for Stops, Distance, and Duration markers.
- Added a 'Stay' label for the duration a stop to make it less confusing for the user.
- Added an Icon on the stop municipality to make it more visually appealing.
- Changed the distance to next stop to use haversine distance instead of road distance to reduce api calls.

## 1.0

### Added
- Initial release of the Lakad app.
