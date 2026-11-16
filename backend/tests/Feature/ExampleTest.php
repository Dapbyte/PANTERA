<?php

test('health endpoint returns successful response', function () {
    $response = $this->getJson('/api/health');

    $response
        ->assertOk()
        ->assertJson([
            'status' => 'success',
            'message' => 'PANTERA API is running',
        ]);
});
