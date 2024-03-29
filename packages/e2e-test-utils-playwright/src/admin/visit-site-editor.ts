/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { Admin } from './';

export interface SiteEditorQueryParams {
	postId: string | number;
	postType: string;
}

const CANVAS_SELECTOR = 'iframe[title="Editor canvas"i] >> visible=true';

/**
 * Visits the Site Editor main page
 *
 * By default, it also skips the welcome guide. The option can be disabled if need be.
 *
 * @param this
 * @param query            Query params to be serialized as query portion of URL.
 * @param skipWelcomeGuide Whether to skip the welcome guide as part of the navigation.
 */
export async function visitSiteEditor(
	this: Admin,
	query: SiteEditorQueryParams,
	skipWelcomeGuide = true
) {
	const path = addQueryArgs( '', {
		...query,
	} ).slice( 1 );

	await this.visitAdminPage( 'site-editor.php', path );

	if ( skipWelcomeGuide ) {
		await this.page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-site', 'welcomeGuide', false );

			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-site', 'welcomeGuideStyles', false );

			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-site', 'welcomeGuidePage', false );

			window.wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-site', 'welcomeGuideTemplate', false );
		} );
	}

	// Check if the current page has an editor canvas first.
	if ( ( await this.page.locator( CANVAS_SELECTOR ).count() ) > 0 ) {
		// The site editor initially loads with an empty body,
		// we need to wait for the editor canvas to be rendered.
		await this.page
			.frameLocator( CANVAS_SELECTOR )
			.locator( 'body > *' )
			.first()
			.waitFor();
	}

	// TODO: Ideally the content underneath the canvas loader should be marked inert until it's ready.
	await this.page
		.locator( '.edit-site-canvas-loader' )
		// Bigger timeout is needed for larger entities, for example the large
		// post html fixture that we load for performance tests, which often
		// doesn't make it under the default 10 seconds.
		.waitFor( { state: 'hidden', timeout: 60_000 } );
}
