<?php

/**
 * AJAX handler for processing bulk newsletter creation requests.
 *
 * @package MailPoet-ACF-Bridge
 */

function pff_handle_bulk_newsletter_ajax()
{
    check_ajax_referer('pff_ajax_nonce', 'security');
    if (empty($_POST['newsletters'])) {
        wp_send_json_error(['message' => 'No newsletters sent.']);
    }

    $batch = json_decode(stripslashes($_POST['newsletters']), true);
    if (!is_array($batch)) $batch = [];

    $results = [];
    foreach ($batch as $newsletter) {
        $subject = sanitize_text_field($newsletter['subject'] ?? '');
        $preview_url = esc_url_raw($newsletter['preview_url'] ?? '');
        $newsletter_id = intval($newsletter['newsletter_id'] ?? 0);
        $sent_date = sanitize_text_field($newsletter['sent_date'] ?? '');

        $status = 'failed';
        $edit_url = '';
        $msg = '';
        if (!$newsletter_id) {
            $msg = 'No newsletter ID.';
        } else {
            $existing = get_posts([
                'post_type'   => 'pocaa-newsletter',
                'meta_key'    => 'newsletter_id',
                'meta_value'  => $newsletter_id,
                'post_status' => array('draft', 'publish', 'pending', 'future'),
                'numberposts' => 1,
            ]);
            if ($existing && !empty($existing[0]->ID)) {
                $status = 'duplicate';
                $edit_url = get_edit_post_link($existing[0]->ID, '');
                $msg = 'Already exists';
            } else {
                $post_id = wp_insert_post([
                    'post_type'   => 'pocaa-newsletter',
                    'post_status' => 'draft',
                    'post_title'  => $subject,
                ]);
                if (!is_wp_error($post_id) && $post_id) {
                    update_field('newsletter_subject_line', $subject, $post_id);
                    update_field('newsletter_preview_url', $preview_url, $post_id);
                    update_field('newsletter_id', $newsletter_id, $post_id);
                    update_field('newsletter_publishing_date', $sent_date, $post_id);
                    $status = 'created';
                    $edit_url = get_edit_post_link($post_id, '');
                    $msg = 'Created OK';
                } else {
                    $msg = 'Failed to create post';
                }
            }
        }
        $results[] = [
            'subject'       => $subject,
            'newsletter_id' => $newsletter_id,
            'status'        => $status,
            'msg'           => $msg,
            'edit_url'      => $edit_url,
        ];
    }
    wp_send_json_success(['batch_results' => $results]);
}
add_action('wp_ajax_pff_create_bulk_newsletters', 'pff_handle_bulk_newsletter_ajax');
