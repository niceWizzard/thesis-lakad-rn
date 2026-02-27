# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/niceWizzard/thesis-lakad-rn/compare/1.1.0...HEAD)

### Changed
- Converted the itinerary settings screen (rename, delete) to a modal for quicker access ([EnigmaG](https://github.com/Brian-Gab)). ([#56](https://github.com/niceWizzard/thesis-lakad-rn/pull/56))
- Disable version checking on dev mode ([EnigmaG](https://github.com/Brian-Gab)). ([#56](https://github.com/niceWizzard/thesis-lakad-rn/pull/56))
- Moved toast notification to top

### Fixed
- Fixed upload button text stays as replace photo even after uploading a new photo 


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
