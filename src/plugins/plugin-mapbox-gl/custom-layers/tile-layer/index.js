/* eslint-disable no-param-reassign,no-restricted-properties,class-methods-use-this,no-underscore-dangle */
import { CompositeLayer } from 'deck.gl';

import BitmapLayer from '../bitmap-layer';

import TileCache from './utils/tile-cache';

const defaultProps = {
  renderSubLayers: props => new BitmapLayer(props),
  getTileData: (/* { x, y, z } */) => Promise.resolve(null),
  onDataLoaded: () => {},
  // eslint-disable-next-line
  onGetTileDataError: err => console.error(err),
  maxZoom: null,
  minZoom: null,
  maxCacheSize: null
};

export default class TileLayer extends CompositeLayer {
  initializeState() {
    const { maxZoom, minZoom, getTileData, onGetTileDataError } = this.props;
    this.state = {
      tiles: [],
      tileCache: new TileCache({ getTileData, maxZoom, minZoom, onGetTileDataError }),
      isLoaded: false
    };
  }

  shouldUpdateState({ changeFlags }) {
    return changeFlags.somethingChanged;
  }

  updateState({ props, context, changeFlags }) {
    const { onDataLoaded, onGetTileDataError } = props;
    if (
      changeFlags.updateTriggersChanged &&
      (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getTileData)
    ) {
      const { getTileData, maxZoom, minZoom, maxCacheSize } = props;
      this.state.tileCache.finalize();
      this.setState({
        tileCache: new TileCache({
          getTileData,
          maxSize: maxCacheSize,
          maxZoom,
          minZoom,
          onGetTileDataError
        })
      });
    }
    if (changeFlags.viewportChanged) {
      const { viewport } = context;
      const z = this.getLayerZoomLevel();
      if (viewport.id !== 'DEFAULT-INITIAL-VIEWPORT') {
        this.state.tileCache.update(viewport, tiles => {
          const currTiles = tiles.filter(tile => tile.z === z);
          const allCurrTilesLoaded = currTiles.every(tile => tile.isLoaded);
          this.setState({ tiles, isLoaded: allCurrTilesLoaded });
          if (!allCurrTilesLoaded) {
            Promise.all(currTiles.map(tile => tile.data)).then(() => {
              this.setState({ isLoaded: true });
              onDataLoaded(currTiles.filter(tile => tile._data).map(tile => tile._data));
            });
          } else {
            onDataLoaded(currTiles.filter(tile => tile._data).map(tile => tile._data));
          }
        });
      }
    }
  }

  getPickingInfo({ info, sourceLayer }) {
    info.sourceLayer = sourceLayer;
    info.tile = sourceLayer.props.tile;
    return info;
  }

  getLayerZoomLevel() {
    const z = Math.floor(this.context.viewport.zoom) + 1;
    const { maxZoom, minZoom } = this.props;
    if (maxZoom && parseInt(maxZoom, 10) === maxZoom && z > maxZoom) {
      return maxZoom;
    }
    if (minZoom && parseInt(minZoom, 10) === minZoom && z < minZoom) {
      return minZoom;
    }
    return z;
  }

  tile2long(x, z) {
    return (x / Math.pow(2, z)) * 360 - 180;
  }

  tile2lat(y, z) {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  renderLayers() {
    const { decodeParams, decodeFunction, opacity } = this.props;
    const zoomLevel = this.getLayerZoomLevel();

    return this.state.tiles.map(tile => {
      const { x, y, z, _data } = tile;

      if (_data && _data.src) {
        // Supported formats:
        // - Coordinates of the bounding box of the bitmap `[minX, minY, maxX, maxY]`
        // - Coordinates of four corners of the bitmap, should follow the sequence of `[[minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY]]`
        // each position could be `[x, y]` or `[x, y, z]` format.

        const topLeft = [this.tile2long(x, z), this.tile2lat(y, z)];
        const topRight = [this.tile2long(x + 1, z), this.tile2lat(y, z)];
        const bottomLeft = [this.tile2long(x, z), this.tile2lat(y + 1, z)];
        const bottomRight = [this.tile2long(x + 1, z), this.tile2lat(y + 1, z)];
        const bounds = [bottomLeft, topLeft, topRight, bottomRight];

        return new BitmapLayer({
          id: `${this.id}-${x}-${y}-${z}`,
          image: _data.src,
          bounds,
          visible: z === zoomLevel,
          zoom: zoomLevel,
          decodeParams,
          decodeFunction,
          opacity
        });
      }
      return null;
    });
  }
}

TileLayer.layerName = 'TileLayer';
TileLayer.defaultProps = defaultProps;
