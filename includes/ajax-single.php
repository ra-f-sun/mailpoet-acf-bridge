<?php

/**
 * AJAX handler for single newsletter creation and linking.
 *
 * @package MailPoet-ACF-Bridge
 */

function pff_handle_create_newsletter_ajax()
{
    check_ajax_referer('pff_ajax_nonce', 'security');
    $subject = sanitize_text_field($_POST['subject'] ?? '');
    $preview_url = esc_url_raw($_POST['preview_url'] ?? '');
    $newsletter_id = intval($_POST['newsletter_id'] ?? 0);
    $sent_date = sanitize_text_field($_POST['sent_date'] ?? '');

    if (!$newsletter_id) {
        wp_send_json_error(['message' => 'No Newsletter ID.']);
    }

    $existing = get_posts([
        'post_type'   => 'pocaa-newsletter',
        'meta_key'    => 'newsletter_id',
        'meta_value'  => $newsletter_id,
        'post_status' => array('draft', 'publish', 'pending', 'future'),
        'numberposts' => 1,
    ]);

    if ($existing && !empty($existing[0]->ID)) {
        $edit_url = get_edit_post_link($existing[0]->ID, '');
        wp_send_json_success([
            'message'   => 'Newsletter already prepared!',
            'edit_url'  => $edit_url,
            'post_id'   => $existing[0]->ID,
            'duplicate' => true,
        ]);
    }

    $post_id = wp_insert_post([
        'post_type'   => 'pocaa-newsletter',
        'post_status' => 'draft',
        'post_title'  => $subject,
    ]);

    if (is_wp_error($post_id) || !$post_id) {
        wp_send_json_error(['message' => 'Could not create draft.']);
    }

    update_field('newsletter_subject_line', $subject, $post_id);
    update_field('newsletter_preview_url', $preview_url, $post_id);
    update_field('newsletter_id', $newsletter_id, $post_id);
    update_field('newsletter_publishing_date', $sent_date, $post_id);

    $edit_url = get_edit_post_link($post_id, '');

    wp_send_json_success([
        'message'   => 'Newsletter created!',
        'edit_url'  => $edit_url,
        'post_id'   => $post_id,
        'duplicate' => false,
    ]);
}
add_action('wp_ajax_pff_create_newsletter', 'pff_handle_create_newsletter_ajax');
