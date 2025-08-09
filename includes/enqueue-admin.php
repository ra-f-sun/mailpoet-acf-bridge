<?php

/**
 * Script enqueue and AJAX nonce localization for MailPoet-ACF Bridge
 *
 * @package MailPoet-ACF-Bridge
 */

add_action('admin_enqueue_scripts', function ($hook) {
    if (strpos($hook, 'mailpoet-newsletters') !== false) {
        wp_enqueue_script(
            'my-pff-mailpoet',
            plugins_url('../assets/js/my-pff-mailpoet.js', __FILE__),
            array('jquery'),
            '1.0',
            true
        );
        wp_localize_script(
            'my-pff-mailpoet',
            'pffAjax',
            array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce'    => wp_create_nonce('pff_ajax_nonce')
            )
        );
    }
});
