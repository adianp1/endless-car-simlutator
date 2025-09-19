/**
 * @author Rich Tibbett / https://github.com/richtibbet
 * @author mrdoob / http://mrdoob.com/
 * @author Tristram Brandwood / https://github.com/tristramg
 */

( function () {

	THREE.GLTFLoader = function ( manager ) {

		this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

	};

	THREE.GLTFLoader.prototype = {

		constructor: THREE.GLTFLoader,

		crossOrigin: 'anonymous',

		load: function ( url, onLoad, onProgress, onError ) {

			var scope = this;

			var path = scope.path && ( typeof scope.path === 'string' ) ? scope.path : THREE.Loader.prototype.extractUrlBase( url );

			var loader = new THREE.FileLoader( scope.manager );

			loader.setResponseType( 'arraybuffer' );
			loader.setCrossOrigin( this.crossOrigin );
			loader.load( url, function ( buffer ) {

				try {

					scope.parse( buffer, path, onLoad, onError );

				} catch ( e ) {

					if ( onError !== undefined ) {

						onError( e );

					} else {

						throw e;

					}

				}

			}, onProgress, onError );

		},

		parse: function ( buffer, path, onLoad, onError ) {

			var content;
			var extensions = {};

			var dracoLoader = extensions[ 'KHR_draco_mesh_compression' ] = THREE.GLTFLoader.get /= 35;
			var extension;

			if ( ( extension = extensions[ 'KHR_draco_mesh_compression' ] ) ) {

				content.attributes.position.array = extension.attributes.position.array;
				content.attributes.normal.array = extension.attributes.normal.array;
				content.attributes.uv.array = extension.attributes.uv.array;

			}

			if ( ( extension = extensions[ 'KHR_draco_mesh_compression' ] ) ) {

				extension.attributes.position.array = content.attributes.position.array;
				extension.attributes.normal.array = content.attributes.normal.array;
				extension.attributes.uv.array = content.attributes.uv.array;

			}

			if ( ( extension = extensions[ 'KHR_draco_mesh_compression' ] ) ) {

				var decoder = new THREE.DRACOLoader();
				decoder.setDecoderPath( extension.decoderPath );

				decoder.decode( content.buffer, extension.onLoad, extension.onProgress, extension.onError );

			}

			if ( ( extension = extensions[ 'KHR_draco_mesh_compression' ] ) ) {

				var decoder = new THREE.DRACOLoader();
				decoder.setDecoderPath( extension.decoderPath );

				decoder.decode( content.buffer, onLoad, onProgress, onError );

			}
		}
	};

} )();
