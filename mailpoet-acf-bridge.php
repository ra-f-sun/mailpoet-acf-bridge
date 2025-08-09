<?php
/*
Plugin Name: MailPoet ACF Bridge
Description: Connects MailPoet admin with your ACF Newsletter post type and fields.
Version: 1.0
Author: Rafsun Jani
License: GPL2
*/

// Enqueue scripts
add_action('admin_enqueue_scripts', function ($hook) {
    if (strpos($hook, 'mailpoet-newsletters') !== false) {
        wp_enqueue_script(
            'my-pff-mailpoet',
            plugin_dir_url(__FILE__) . 'my-pff-mailpoet.js',
            array('jquery'),
            '1.0',
            true
        );

        // Localize the script
        wp_localize_script(
            'my-pff-mailpoet',
            'pffAjax',
            array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('pff_ajax_nonce')
            )
        );
    }
});


// Ajax handler
add_action('wp_ajax_pff_create_newsletter', function () {
    check_ajax_referer('pff_ajax_nonce', 'security');

    // Get the form data
    $subject = sanitize_text_field($_POST['subject'] ?? '');
    $preview_url = esc_url_raw($_POST['preview_url'] ?? '');
    $newsletter_id = intval($_POST['newsletter_id'] ?? 0);
    $sent_date = sanitize_text_field($_POST['sent_date'] ?? '');

    // Validate
    if (!$newsletter_id) {
        wp_send_json_error(['message' => 'No Newsletter ID.']);
    }

    // Check if the newsletter already exists in the database
    $existing = get_posts([
        'post_type'  => 'pocaa-newsletter',
        'meta_key'   => 'newsletter_id',
        'meta_value' => $newsletter_id,
        'post_status' => array('draft', 'publish', 'pending', 'future'),
        'numberposts' => 1,
    ]);

    // If it does, return the existing post
    if ($existing && !empty($existing[0]->ID)) {
        $edit_url = get_edit_post_link($existing[0]->ID, '');
        wp_send_json_success([
            'message' => 'Newsletter already prepared!',
            'edit_url' => $edit_url,
            'post_id' => $existing[0]->ID,
            'duplicate' => true,
        ]);
    }

    // Create the post and update the fields with the form data
    $post_id = wp_insert_post([
        'post_type'   => 'pocaa-newsletter',
        'post_status' => 'draft',
        'post_title'  => $subject,
    ]);

    // Check if the post was created successfully or not and return
    if (is_wp_error($post_id) || !$post_id) {
        wp_send_json_error(['message' => 'Could not create draft.']);
    }

    update_field('newsletter_subject_line', $subject, $post_id);
    update_field('newsletter_preview_url', $preview_url, $post_id);
    update_field('newsletter_id', $newsletter_id, $post_id);
    update_field('newsletter_publishing_date', $sent_date, $post_id);

    $edit_url = get_edit_post_link($post_id, '');

    wp_send_json_success([
        'message' => 'Newsletter created!',
        'edit_url' => $edit_url,
        'post_id' => $post_id,
        'duplicate' => false,
    ]);
});
