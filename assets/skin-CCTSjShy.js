var e=`<media-container class="media-skin usher" data-theme="usher" data-preset="video">
<!-- Add a compatible media component here. -->
<media-poster class="usher-poster">
<img alt="" decoding="async" class="usher-poster-image">
</media-poster>
<media-buffering-indicator class="usher-buffering">
</media-buffering-indicator>
<media-controls>
<div class="usher-frame">
<media-controls-backdrop class="usher-shade">
</media-controls-backdrop>
<media-controls-content class="usher-content">
<media-tooltip-group>
<media-title class="usher-title">
</media-title>
<media-controls-group class="usher-center">
<media-seek-button seconds="-10" class="media-button usher-transport">
<span class="usher-transport-glyph">
<media-icon family="usher" name="seek" class="usher-icon usher-transport-icon">
</media-icon>
<span class="usher-transport-label" aria-hidden="true">10</span>
</span>
</media-seek-button>
<media-play-button class="media-button usher-hero">
<span class="usher-hero-glyph">
<media-icon family="usher" name="spinner" class="usher-icon usher-spinner">
</media-icon>
<media-icon family="usher" name="restart" class="usher-icon usher-play-restart">
</media-icon>
<media-icon family="usher" name="play" class="usher-icon usher-play-play">
</media-icon>
<media-icon family="usher" name="pause" class="usher-icon usher-play-pause">
</media-icon>
</span>
<media-time type="duration" class="usher-hero-time">
</media-time>
</media-play-button>
<media-seek-button seconds="10" class="media-button usher-transport">
<span class="usher-transport-glyph">
<media-icon family="usher" name="seek" class="usher-icon usher-transport-icon">
</media-icon>
<span class="usher-transport-label" aria-hidden="true">10</span>
</span>
</media-seek-button>
</media-controls-group>
<div class="usher-bottom">
<div class="usher-line-row">
<media-time-slider class="usher-slider">
<media-time-slider-chapters class="usher-chapters">
<template>
<div class="usher-chapter">
<div class="usher-chapter-line">
<media-slider-track class="usher-track">
<media-slider-buffer class="usher-buffer">
</media-slider-buffer>
<media-slider-fill class="usher-fill">
</media-slider-fill>
</media-slider-track>
</div>
<span class="usher-chapter-name">
</span>
</div>
</template>
</media-time-slider-chapters>
<usher-chapter-names hidden>
</usher-chapter-names>
<media-slider-preview class="usher-preview">
<span class="usher-preview-card">
<media-slider-thumbnail class="usher-thumbnail">
<img alt="" aria-hidden="true" decoding="async" class="usher-thumbnail-image">
</media-slider-thumbnail>
<media-time-slider-chapter-title class="usher-preview-chapter">
</media-time-slider-chapter-title>
</span>
</media-slider-preview>
<span class="usher-ghost" aria-hidden="true">
<media-slider-value type="pointer">
</media-slider-value>
</span>
<media-slider-thumb class="usher-thumb">
<span class="usher-marker" aria-hidden="true">
<media-icon family="usher" name="spinner" class="usher-icon usher-spinner">
</media-icon>
<media-slider-value type="current" class="usher-marker-time">
</media-slider-value>
<media-slider-value type="pointer" class="usher-marker-pointer">
</media-slider-value>
<usher-rate class="usher-marker-rate" hidden>
</usher-rate>
</span>
</media-slider-thumb>
<usher-time-field class="usher-field" hidden>
<input class="usher-field-input" type="text" inputmode="numeric" enterkeyhint="go" autocomplete="off" autocorrect="off" spellcheck="false">
</usher-time-field>
</media-time-slider>
<media-time type="duration" class="usher-duration">
</media-time>
</div>
<div class="usher-row">
<media-controls-group class="usher-row-start">
<media-play-button class="media-button usher-play" id="usher-play">
<media-icon family="usher" name="restart" class="usher-icon usher-play-restart">
</media-icon>
<media-icon family="usher" name="play" class="usher-icon usher-play-play">
</media-icon>
<media-icon family="usher" name="pause" class="usher-icon usher-play-pause">
</media-icon>
</media-play-button>
<media-tooltip trigger="usher-play" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-mute-button class="media-button usher-mute" id="usher-mute">
<media-icon family="usher" name="volume-off" class="usher-icon usher-mute-off">
</media-icon>
<media-icon family="usher" name="volume-low" class="usher-icon usher-mute-low">
</media-icon>
<media-icon family="usher" name="volume-high" class="usher-icon usher-mute-high">
</media-icon>
</media-mute-button>
<media-tooltip trigger="usher-mute" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-volume-slider class="usher-volume usher-volume-inline">
<media-slider-track class="usher-volume-track">
<media-slider-fill class="usher-volume-fill">
</media-slider-fill>
</media-slider-track>
<media-slider-thumb class="usher-volume-thumb">
<media-slider-value class="usher-volume-value">
</media-slider-value>
</media-slider-thumb>
</media-volume-slider>
<usher-chapter class="usher-chapter-slot">
<button type="button" tabindex="0" commandfor="usher-chapter-menu" class="media-button usher-chapter-button">
<span class="usher-chapter-title">
</span>
<media-icon family="usher" name="chevron" class="usher-icon usher-chapter-chevron">
</media-icon>
</button>
<media-menu side="top" align="start" class="media-popup usher-menu usher-chapter-menu" id="usher-chapter-menu">
<media-menu-content class="media-menu-content">
<usher-chapter-list class="usher-chapter-list">
</usher-chapter-list>
</media-menu-content>
</media-menu>
</usher-chapter>
</media-controls-group>
<media-controls-group class="usher-row-end">
<media-captions-button class="media-button usher-captions" id="usher-captions">
<media-icon family="usher" name="captions-off" class="usher-icon usher-captions-off">
</media-icon>
<media-icon family="usher" name="captions-on" class="usher-icon usher-captions-on">
</media-icon>
</media-captions-button>
<media-tooltip trigger="usher-captions" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<button type="button" tabindex="0" commandfor="usher-settings-menu" class="media-button usher-settings" id="usher-settings">
<media-icon family="usher" name="gear" class="usher-icon usher-gear">
</media-icon>
<media-text class="usher-visually-hidden" token="menu.settings">Settings</media-text>
</button>
<media-tooltip trigger="usher-settings" side="top" class="media-popup usher-tooltip">
<media-text token="menu.settings">Settings</media-text>
</media-tooltip>
<media-menu side="top" align="end" class="media-popup usher-menu" id="usher-settings-menu">
<media-menu-content class="media-menu-content">
<media-menu-item commandfor="usher-menu-volume" class="media-menu-item usher-menu-volume-item">
<media-icon family="usher" name="volume-high" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="volume.label">Volume</media-text>
<span class="media-menu-hint">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-volume">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="volume.label">Volume</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<usher-volume-route hidden>
</usher-volume-route>
<div class="usher-menu-volume-row">
<media-volume-slider class="usher-volume usher-volume-menu">
<media-slider-track class="usher-volume-track">
<media-slider-fill class="usher-volume-fill">
</media-slider-fill>
</media-slider-track>
<media-slider-thumb class="usher-volume-thumb">
<media-slider-value class="usher-volume-value">
</media-slider-value>
</media-slider-thumb>
</media-volume-slider>
</div>
</media-menu-content>
<media-menu-item commandfor="usher-menu-quality" class="media-menu-item">
<media-icon family="usher" name="quality" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.quality">Quality</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-quality">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.quality">Quality</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-quality-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span class="media-menu-label">
<span data-part="label">
</span>
<sup data-part="tier" class="media-menu-tier">
</sup>
</span>
<span data-part="badge" class="media-menu-badge">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-quality-radio-group>
</media-menu-content>
<media-menu-item commandfor="usher-menu-audio" class="media-menu-item">
<media-icon family="usher" name="speech" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.audio">Audio</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-audio">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.audio">Audio</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-audio-track-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span data-part="label" class="media-menu-label">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-audio-track-radio-group>
</media-menu-content>
<media-menu-item commandfor="usher-menu-speed" class="media-menu-item">
<media-icon family="usher" name="speed" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.speed">Speed</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-speed">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.speed">Speed</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-playback-rate-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span data-part="label" class="media-menu-label">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-playback-rate-radio-group>
</media-menu-content>
<media-menu-item commandfor="usher-menu-captions" class="media-menu-item">
<media-icon family="usher" name="captions-off" class="usher-icon media-menu-icon">
</media-icon>
<media-text token="menu.captions">Captions</media-text>
<span class="media-menu-hint">
<span data-part="value" class="media-menu-hint-label">
</span>
<media-icon family="usher" name="chevron" class="usher-icon media-menu-forward">
</media-icon>
</span>
</media-menu-item>
<media-menu-content class="media-menu-content" id="usher-menu-captions">
<media-menu-item class="media-menu-item media-menu-back">
<media-icon family="usher" name="chevron" class="usher-icon media-menu-back-chevron">
</media-icon>
<media-text token="menu.captions">Captions</media-text>
</media-menu-item>
<media-menu-separator class="media-menu-separator">
</media-menu-separator>
<media-captions-radio-group class="media-menu-radio-group">
<template>
<media-menu-radio-item class="media-menu-item media-menu-radio-item">
<span data-part="label" class="media-menu-label">
</span>
<span data-part="badge" class="media-menu-badge">
</span>
<media-menu-item-indicator force-mount class="media-menu-indicator">
<media-icon family="usher" name="check" class="usher-icon">
</media-icon>
</media-menu-item-indicator>
</media-menu-radio-item>
</template>
</media-captions-radio-group>
</media-menu-content>
</media-menu-content>
</media-menu>
<media-pip-button class="media-button usher-pip" id="usher-pip">
<media-icon family="usher" name="pip-enter" class="usher-icon usher-pip-enter">
</media-icon>
<media-icon family="usher" name="pip-exit" class="usher-icon usher-pip-exit">
</media-icon>
</media-pip-button>
<media-tooltip trigger="usher-pip" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-cast-button class="media-button usher-cast" id="usher-cast">
<media-icon family="usher" name="cast-enter" class="usher-icon usher-cast-enter">
</media-icon>
<media-icon family="usher" name="cast-exit" class="usher-icon usher-cast-exit">
</media-icon>
</media-cast-button>
<media-tooltip trigger="usher-cast" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-airplay-button class="media-button usher-airplay" id="usher-airplay">
<media-icon family="usher" name="airplay-enter" class="usher-icon usher-airplay-enter">
</media-icon>
<media-icon family="usher" name="airplay-exit" class="usher-icon usher-airplay-exit">
</media-icon>
</media-airplay-button>
<media-tooltip trigger="usher-airplay" side="top" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
<media-fullscreen-button class="media-button usher-fullscreen" id="usher-fullscreen">
<media-icon family="usher" name="fullscreen-enter" class="usher-icon usher-fullscreen-enter">
</media-icon>
<media-icon family="usher" name="fullscreen-exit" class="usher-icon usher-fullscreen-exit">
</media-icon>
</media-fullscreen-button>
<media-tooltip trigger="usher-fullscreen" side="top" align="end" class="media-popup usher-tooltip">
<media-tooltip-label>
</media-tooltip-label>
<media-tooltip-shortcut class="usher-shortcut">
</media-tooltip-shortcut>
</media-tooltip>
</media-controls-group>
</div>
</div>
</media-tooltip-group>
</media-controls-content>
</div>
</media-controls>
<media-error-dialog>
<media-dialog-backdrop class="usher-dialog-backdrop">
</media-dialog-backdrop>
<media-dialog-popup class="usher-dialog">
<media-dialog-title class="usher-dialog-title">
</media-dialog-title>
<media-dialog-description class="usher-dialog-description">
</media-dialog-description>
<media-dialog-close class="media-button usher-dialog-close">
</media-dialog-close>
</media-dialog-popup>
</media-error-dialog>
<media-hotkey keys="Space" action="togglePaused">
</media-hotkey>
<media-hotkey keys="k" action="togglePaused">
</media-hotkey>
<media-hotkey keys="m" action="toggleMuted">
</media-hotkey>
<media-hotkey keys="ArrowRight" action="seekStep">
</media-hotkey>
<media-hotkey keys="ArrowLeft" action="seekStep">
</media-hotkey>
<media-hotkey keys="l" action="seekStep">
</media-hotkey>
<media-hotkey keys="j" action="seekStep">
</media-hotkey>
<media-hotkey keys="ArrowUp" action="volumeStep">
</media-hotkey>
<media-hotkey keys="ArrowDown" action="volumeStep">
</media-hotkey>
<media-hotkey keys="0-9" action="seekToPercent">
</media-hotkey>
<media-hotkey keys="Home" action="seekToPercent" value="0">
</media-hotkey>
<media-hotkey keys="End" action="seekToPercent" value="100">
</media-hotkey>
<media-hotkey keys=">" action="speedUp">
</media-hotkey>
<media-hotkey keys="<" action="speedDown">
</media-hotkey>
<media-hotkey keys="f" action="toggleFullscreen">
</media-hotkey>
<media-hotkey keys="c" action="toggleSubtitles">
</media-hotkey>
<media-hotkey keys="i" action="togglePictureInPicture">
</media-hotkey>
<media-gesture type="tap" action="togglePaused" pointer="mouse" region="center">
</media-gesture>
<media-gesture type="tap" action="toggleControls" pointer="touch">
</media-gesture>
<media-gesture type="doubletap" action="seekStep" region="left">
</media-gesture>
<media-gesture type="doubletap" action="toggleFullscreen" region="center">
</media-gesture>
<media-gesture type="doubletap" action="seekStep" region="right">
</media-gesture>
<media-status-announcer class="usher-visually-hidden">
</media-status-announcer>
<div aria-hidden="true" class="usher-indicators">
<media-status-indicator actions="togglePaused,toggleSubtitles,toggleFullscreen,togglePictureInPicture" class="usher-status">
<media-icon family="usher" name="play" class="usher-icon usher-status-play">
</media-icon>
<media-icon family="usher" name="pause" class="usher-icon usher-status-pause">
</media-icon>
<media-icon family="usher" name="captions-on" class="usher-icon usher-status-captions-on">
</media-icon>
<media-icon family="usher" name="captions-off" class="usher-icon usher-status-captions-off">
</media-icon>
<media-icon family="usher" name="fullscreen-enter" class="usher-icon usher-status-fullscreen">
</media-icon>
<media-icon family="usher" name="fullscreen-exit" class="usher-icon usher-status-exit-fullscreen">
</media-icon>
<media-icon family="usher" name="pip-enter" class="usher-icon usher-status-pip">
</media-icon>
<media-icon family="usher" name="pip-exit" class="usher-icon usher-status-exit-pip">
</media-icon>
</media-status-indicator>
<usher-rate-indicator class="usher-rate-slot">
<media-status-indicator actions="speedUp,speedDown" class="usher-hollow usher-rate-indicator">
<media-icon family="usher" name="speed" class="usher-icon">
</media-icon>
<media-status-indicator-value class="usher-indicator-value">
</media-status-indicator-value>
</media-status-indicator>
</usher-rate-indicator>
<media-volume-indicator class="usher-hollow usher-volume-indicator">
<media-volume-indicator-fill class="usher-volume-indicator-fill">
<media-icon family="usher" name="volume-high" class="usher-icon usher-volume-indicator-high">
</media-icon>
<media-icon family="usher" name="volume-low" class="usher-icon usher-volume-indicator-low">
</media-icon>
<media-icon family="usher" name="volume-off" class="usher-icon usher-volume-indicator-off">
</media-icon>
<media-volume-indicator-value class="usher-indicator-value">
</media-volume-indicator-value>
</media-volume-indicator-fill>
</media-volume-indicator>
<media-seek-indicator class="usher-hollow usher-seek-indicator">
<media-icon family="usher" name="seek" class="usher-icon">
</media-icon>
<media-seek-indicator-value class="usher-indicator-value">
</media-seek-indicator-value>
</media-seek-indicator>
</div>
</media-container>
`;export{e as t};